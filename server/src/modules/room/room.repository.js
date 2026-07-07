const prisma = require('#db/prisma')

// Rooms always travel with their owner and their seated players (join order
// preserved) so the service can build a complete DTO in one query.
const roomInclude = {
  owner: { select: { id: true, username: true } },
  players: {
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
}

// Structured failure reasons for the transactional mutations below. The
// service layer translates these into typed HTTP exceptions or retries.
const ROOM_ERRORS = {
  NOT_FOUND: 'NOT_FOUND',
  NOT_OPEN: 'NOT_OPEN',
  FULL: 'FULL',
  NOT_A_MEMBER: 'NOT_A_MEMBER',
  LIMIT_REACHED: 'LIMIT_REACHED',
  CONFLICT: 'CONFLICT',
}

// Prisma's "transaction failed due to a write conflict, retry" error code.
const SERIALIZATION_CONFLICT_CODE = 'P2034'

// Prisma's "unique constraint violated" error code.
const UNIQUE_VIOLATION_CODE = 'P2002'

/**
 * Runs a mutation at Serializable isolation and reports a lost race as a
 * structured CONFLICT result instead of a thrown error, so callers can retry
 * (concurrent seats are routine: React strict mode alone double-fires them).
 */
const runSerializable = async (transactionBody) => {
  try {
    return await prisma.$transaction(transactionBody, {
      isolationLevel: 'Serializable',
    })
  } catch (error) {
    if (error.code === SERIALIZATION_CONFLICT_CODE) {
      return { error: ROOM_ERRORS.CONFLICT }
    }
    throw error
  }
}

/**
 * Creates a room and seats the owner in the same write, unless the number of
 * OPEN rooms has already hit the given limit. The count and the create run in
 * one serializable transaction so two players racing to create the first room
 * cannot both succeed.
 *
 * @param {{ name: string, capacity: number, ownerId: number, maxOpenRooms: number }} data
 * @returns {Promise<{ room?: Object, error?: string }>}
 */
const createRoomIfUnderLimit = ({ name, capacity, ownerId, maxOpenRooms }) => {
  return runSerializable(async (tx) => {
    const openRooms = await tx.room.count({ where: { status: 'OPEN' } })
    if (openRooms >= maxOpenRooms) {
      return { error: ROOM_ERRORS.LIMIT_REACHED }
    }

    const room = await tx.room.create({
      data: {
        name,
        capacity,
        ownerId,
        players: { create: [{ userId: ownerId }] },
      },
      include: roomInclude,
    })
    return { room }
  })
}

/**
 * Rooms the lobby page should show: open ones plus those currently in a game.
 * CLOSED rooms are history and never surface here.
 */
const findVisibleRooms = () => {
  return prisma.room.findMany({
    where: { status: { in: ['OPEN', 'IN_GAME'] } },
    orderBy: { createdAt: 'asc' },
    include: roomInclude,
  })
}

/**
 * The open room a user is currently seated in, if any.
 * @param {number} userId
 */
const findOpenRoomByUserId = (userId) => {
  return prisma.room.findFirst({
    where: { status: 'OPEN', players: { some: { userId } } },
    include: roomInclude,
  })
}

/**
 * The open or in-game room a user is seated in, if any. Seating checks this
 * so a repeated seat request (double-mounted effect, page refresh) returns
 * the existing seat instead of opening a second room for the same player.
 * @param {number} userId
 */
const findActiveRoomByUserId = (userId) => {
  return prisma.room.findFirst({
    where: {
      status: { in: ['OPEN', 'IN_GAME'] },
      players: { some: { userId } },
    },
    include: roomInclude,
  })
}

/**
 * Seats a player in a room, re-checking status and capacity inside a
 * serializable transaction so two simultaneous joins cannot overshoot the
 * last seat. Idempotent per user: if the player already holds a seat in the
 * room, that seat is returned as success — duplicate seat requests are
 * routine (the same user's requests can race each other).
 *
 * @param {number} roomId
 * @param {number} userId
 * @returns {Promise<{ room?: Object, error?: string }>}
 */
const addPlayerToRoom = async (roomId, userId) => {
  try {
    return await runSerializable(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { players: true },
      })
      if (!room) return { error: ROOM_ERRORS.NOT_FOUND }

      // Already seated (regardless of room status): mission accomplished.
      if (room.players.some((player) => player.userId === userId)) {
        const seatedRoom = await tx.room.findUnique({
          where: { id: roomId },
          include: roomInclude,
        })
        return { room: seatedRoom }
      }

      if (room.status !== 'OPEN') return { error: ROOM_ERRORS.NOT_OPEN }
      if (room.players.length >= room.capacity) {
        return { error: ROOM_ERRORS.FULL }
      }

      await tx.roomPlayer.create({ data: { roomId, userId } })
      const updatedRoom = await tx.room.findUnique({
        where: { id: roomId },
        include: roomInclude,
      })
      return { room: updatedRoom }
    })
  } catch (error) {
    // The only unique constraint this transaction can violate is
    // (roomId, userId), so a P2002 means a concurrent request already seated
    // this exact user: re-read the room and report the seat as success. If
    // the seat is already gone again (seated then left before this read),
    // report CONFLICT so the caller's retry loop re-reads the world instead
    // of being told about a seat that no longer exists.
    if (error.code !== UNIQUE_VIOLATION_CODE) throw error
    const seatedRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: roomInclude,
    })
    const isStillSeated = seatedRoom?.players.some(
      (player) => player.userId === userId,
    )
    if (!isStillSeated) return { error: ROOM_ERRORS.CONFLICT }
    return { room: seatedRoom }
  }
}

/**
 * Unseats a player from an open room. An emptied room closes; if the owner
 * leaves a room that still has players, ownership passes to the earliest
 * remaining joiner so the room stays alive.
 *
 * @param {number} roomId
 * @param {number} userId
 * @returns {Promise<{ room?: Object, error?: string }>}
 */
const removePlayerFromRoom = (roomId, userId) => {
  return runSerializable(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: {
        players: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!room) return { error: ROOM_ERRORS.NOT_FOUND }

    const membership = room.players.find((player) => player.userId === userId)
    if (!membership) return { error: ROOM_ERRORS.NOT_A_MEMBER }

    await tx.roomPlayer.delete({ where: { id: membership.id } })

    const remainingPlayers = room.players.filter(
      (player) => player.userId !== userId,
    )
    const roomUpdate =
      remainingPlayers.length === 0
        ? { status: 'CLOSED' }
        : room.ownerId === userId
          ? { ownerId: remainingPlayers[0].userId }
          : {}

    const updatedRoom = await tx.room.update({
      where: { id: roomId },
      data: roomUpdate,
      include: roomInclude,
    })
    return { room: updatedRoom }
  })
}

/**
 * The room currently tied to a runtime game id, if it is still active. Used to
 * reopen a room for the survivors when one player leaves the game.
 * @param {string} gameId runtime game UUID
 */
const findActiveRoomByGameId = (gameId) => {
  return prisma.room.findFirst({
    where: { gameId, status: { in: ['OPEN', 'IN_GAME'] } },
    include: roomInclude,
  })
}

/**
 * Reopens an in-game room for the players left behind after some leave the
 * match. The departing memberships (the leaver and any bots) are removed; if a
 * human survivor remains the room flips IN_GAME back to OPEN with its game id
 * cleared, so it reappears in the lobby as a joinable room and refills for a
 * fresh game. If nobody is left to wait, the room closes instead. Ownership
 * passes to the earliest-joined survivor when the owner is one of the leavers.
 *
 * The whole thing is one serializable transaction and is guarded on the room
 * still being IN_GAME, so a game that meanwhile ended by another path (a
 * concurrent completion or a second teardown) is left untouched.
 *
 * @param {number} roomId
 * @param {number[]} removeUserIds ids to unseat (leaver plus bots)
 * @returns {Promise<{ room?: Object, reopened?: boolean, error?: string }>}
 *   `reopened` is true when survivors kept the room open, false when it closed
 */
const reopenRoomForRematch = (roomId, removeUserIds = []) => {
  const removeSet = new Set(removeUserIds)
  return runSerializable(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: { players: { orderBy: { createdAt: 'asc' } } },
    })
    if (!room) return { error: ROOM_ERRORS.NOT_FOUND }
    if (room.status !== 'IN_GAME') return { error: ROOM_ERRORS.NOT_OPEN }

    const departed = room.players.filter((player) =>
      removeSet.has(player.userId),
    )
    if (departed.length > 0) {
      await tx.roomPlayer.deleteMany({
        where: { id: { in: departed.map((player) => player.id) } },
      })
    }

    const survivors = room.players.filter(
      (player) => !removeSet.has(player.userId),
    )
    if (survivors.length === 0) {
      const closed = await tx.room.update({
        where: { id: roomId },
        data: { status: 'CLOSED' },
        include: roomInclude,
      })
      return { room: closed, reopened: false }
    }

    const ownerLeft = removeSet.has(room.ownerId)
    const reopened = await tx.room.update({
      where: { id: roomId },
      data: {
        status: 'OPEN',
        gameId: null,
        ...(ownerLeft ? { ownerId: survivors[0].userId } : {}),
      },
      include: roomInclude,
    })
    return { room: reopened, reopened: true }
  })
}

/**
 * Marks a full room as playing and records the runtime game id so the room
 * can be closed when that game ends.
 */
const setRoomInGame = (roomId, gameId) => {
  return prisma.room.update({
    where: { id: roomId },
    data: { status: 'IN_GAME', gameId },
    include: roomInclude,
  })
}

/**
 * Compare-and-set claim of a room for match start: flips OPEN to IN_GAME
 * only while the room is still OPEN. `updateMany` makes the status check and
 * the flip one statement, so of two concurrent callers exactly one sees
 * count 1; the loser must not start a match.
 * @param {number} roomId
 * @returns {Promise<boolean>} true when this caller won the claim
 */
const claimRoomForGame = async (roomId) => {
  const { count } = await prisma.room.updateMany({
    where: { id: roomId, status: 'OPEN' },
    data: { status: 'IN_GAME' },
  })
  return count === 1
}

/**
 * Reverts a claimed room to OPEN after a failed match start. Guarded on the
 * game id still being empty so a room with a running game can never reopen.
 * @param {number} roomId
 */
const reopenClaimedRoom = async (roomId) => {
  await prisma.room.updateMany({
    where: { id: roomId, status: 'IN_GAME', gameId: null },
    data: { status: 'OPEN' },
  })
}

/**
 * Closes a single OPEN room (the owner's explicit "End the room" action).
 * Guarded on OPEN so it never touches a room that has meanwhile started a
 * game or already closed.
 * @param {number} roomId
 * @returns {Promise<number>} rows closed (0 or 1)
 */
const closeOpenRoomById = async (roomId) => {
  const { count } = await prisma.room.updateMany({
    where: { id: roomId, status: 'OPEN' },
    data: { status: 'CLOSED' },
  })
  return count
}

/**
 * Closes every room tied to a finished game.
 * @param {string} gameId runtime game UUID
 * @returns {Promise<number>} number of rooms closed
 */
const closeRoomsByGameId = async (gameId) => {
  const { count } = await prisma.room.updateMany({
    where: { gameId, status: { not: 'CLOSED' } },
    data: { status: 'CLOSED' },
  })
  return count
}

module.exports = {
  ROOM_ERRORS,
  createRoomIfUnderLimit,
  findActiveRoomByUserId,
  findVisibleRooms,
  findOpenRoomByUserId,
  addPlayerToRoom,
  removePlayerFromRoom,
  findActiveRoomByGameId,
  reopenRoomForRematch,
  setRoomInGame,
  claimRoomForGame,
  reopenClaimedRoom,
  closeOpenRoomById,
  closeRoomsByGameId,
}
