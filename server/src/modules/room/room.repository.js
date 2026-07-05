const prisma = require('#db/prisma')

// Rooms always travel with their owner and their seated players (join order
// preserved) so the service can build a complete DTO in one query.
const roomInclude = {
  owner: { select: { id: true, username: true } },
  players: {
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, username: true } } },
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
  setRoomInGame,
  closeRoomsByGameId,
}
