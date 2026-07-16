/**
 * RoomService - Lifecycle of persistent game rooms.
 *
 * A room is the durable record of "who is gathering to play": it has an owner,
 * a capacity, seated players, and a status (OPEN -> IN_GAME -> CLOSED). The
 * `seatUser` is the quick-start path behind the waiting room: join a visible
 * open room when one exists, otherwise create the default room. `createRoom`
 * is the explicit lobby action: always open a room owned by the caller instead
 * of falling through to another player's room.
 * The service owns the seating policy; the socket layer decides when a full
 * room becomes a running match. See docs/erm/room.md for the data model.
 */

const roomRepository = require('#modules/room/room.repository')
const botPlayers = require('#modules/game/bot-player.service')
const {
  MAX_OPEN_ROOMS,
  DEFAULT_CAPACITY,
  ALLOWED_CAPACITIES,
} = require('#modules/room/room.constants')
const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')

// Retries absorb the races the repository reports as structured errors:
// losing a create/join race (including serialization CONFLICTs — React strict
// mode alone double-fires seat requests) means the room list just changed, so
// the next pass sees the winner's room and joins or re-uses it. Filling a
// larger room means several players contend for the same room's seats at once,
// and serializable transactions abort on conflict, so a plain 3 retries can
// leave the last joiner stranded and the room one seat short. More attempts
// with a jittered backoff let every joiner find a clean window (#154).
const SEAT_ATTEMPTS = 10
const LEAVE_ATTEMPTS = 5

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Jittered backoff between contended attempts, so concurrent joiners stop
// colliding on the same serialized window instead of retrying in lockstep.
const backoffBeforeRetry = (attempt) =>
  sleep(15 + Math.floor(Math.random() * 25) * (attempt + 1))

/**
 * Shapes a Prisma room row into the payload clients receive. Players are in
 * join order, so `players[0]` mirrors the owner unless ownership was
 * transferred after a leave.
 */
const toRoomDto = (room) => ({
  id: room.id,
  name: room.name,
  capacity: room.capacity,
  status: room.status,
  owner: { userId: room.owner.id, username: room.owner.username },
  players: room.players.map(({ user }) => ({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  })),
})

const isRoomFull = (roomDto) => roomDto.players.length >= roomDto.capacity

const validateCapacity = (capacity) => {
  if (capacity !== undefined && !ALLOWED_CAPACITIES.includes(capacity)) {
    throw new BadRequestException('Unsupported room size', {
      details: [`Room size must be one of ${ALLOWED_CAPACITIES.join(', ')}`],
    })
  }
}

const resolveActiveOwnerRoom = (
  currentRoom,
  ownerId,
  { openRoomMessage, inGameMessage },
) => {
  if (!currentRoom) return null

  const dto = toRoomDto(currentRoom)
  if (dto.status === 'OPEN' && currentRoom.ownerId === ownerId) return dto
  if (dto.status === 'OPEN') {
    throw new ConflictException(openRoomMessage)
  }
  throw new ConflictException(inGameMessage)
}

const findActiveOwnerRoom = async (ownerId, messages) => {
  const currentRoom = await roomRepository.findActiveRoomByUserId(ownerId)
  return resolveActiveOwnerRoom(currentRoom, ownerId, messages)
}

const openRoomForOwner = async (
  owner,
  { capacity, name, openRoomMessage, inGameMessage } = {},
) => {
  const messages = { openRoomMessage, inGameMessage }

  for (let attempt = 0; attempt < SEAT_ATTEMPTS; attempt += 1) {
    const { room, error } = await roomRepository.createRoomIfUnderLimit({
      name: name ?? `${owner.username}'s room`,
      capacity: capacity ?? DEFAULT_CAPACITY,
      ownerId: owner.id,
      maxOpenRooms: MAX_OPEN_ROOMS,
    })
    if (room) return toRoomDto(room)
    if (error === roomRepository.ROOM_ERRORS.CONFLICT) {
      const currentRoom = await findActiveOwnerRoom(owner.id, messages)
      if (currentRoom) return currentRoom
      await backoffBeforeRetry(attempt)
      continue
    }
    if (error === roomRepository.ROOM_ERRORS.LIMIT_REACHED) {
      const currentRoom = await findActiveOwnerRoom(owner.id, messages)
      if (currentRoom) return currentRoom
      throw new ConflictException('The room limit has been reached')
    }
    throw new ConflictException('Could not open the room, try again')
  }

  const currentRoom = await findActiveOwnerRoom(owner.id, messages)
  if (currentRoom) return currentRoom
  throw new ConflictException('Could not open the room, try again')
}

/**
 * Rooms the lobby page shows: OPEN and IN_GAME, oldest first.
 * @returns {Promise<Array<Object>>} room DTOs
 */
const listRooms = async () => {
  const rooms = await roomRepository.findVisibleRooms()
  return rooms.map(toRoomDto)
}

/**
 * Seats a user through quick start. Idempotent: re-uses the open or
 * in-game room they are already in (so a double-mounted effect or a refresh
 * mid-game never opens a second room for the same player).
 *
 * If a joinable open room exists, quick start joins it, whatever its size. If
 * none exists, the caller opens one: with an explicit `capacity` when supplied,
 * otherwise the default two-player room (#156).
 *
 * @param {{ id: number, username: string }} user
 * @param {{ capacity?: number }} [options]
 * @returns {Promise<Object>} the room DTO the user is seated in; the caller
 *   checks `isRoomFull` on it to decide whether the match should start
 */
const seatUser = async (user, { capacity } = {}) => {
  validateCapacity(capacity)

  for (let attempt = 0; attempt < SEAT_ATTEMPTS; attempt += 1) {
    // One read serves both checks on the seat hot path: the visible-rooms list
    // already carries the OPEN/IN_GAME room this user is seated in (if any), so
    // the idempotency check reuses it instead of spending a separate
    // findActiveRoomByUserId round-trip. On a warm DB that is one fewer query
    // per attempt — the common create/join path drops from three reads to two.
    const visibleRooms = await roomRepository.findVisibleRooms()
    const currentRoom = visibleRooms.find((room) =>
      room.players.some((player) => player.user.id === user.id),
    )
    if (currentRoom) {
      return toRoomDto(currentRoom)
    }

    // Quick start joins an existing open room if one is available.
    const joinableRooms = visibleRooms.filter(
      (room) => room.status === 'OPEN' && room.players.length < room.capacity,
    )
    for (const candidate of joinableRooms) {
      const { room } = await roomRepository.addPlayerToRoom(
        candidate.id,
        user.id,
      )
      if (room) {
        return toRoomDto(room)
      }
      // Someone else took the seat first; try the next candidate.
    }

    // No open room: open one. The capacity choice only matters here, when the
    // caller is the one creating the room.
    const { room: createdRoom } = await roomRepository.createRoomIfUnderLimit({
      name: `${user.username}'s room`,
      capacity: capacity ?? DEFAULT_CAPACITY,
      ownerId: user.id,
      maxOpenRooms: MAX_OPEN_ROOMS,
    })
    if (createdRoom) {
      return toRoomDto(createdRoom)
    }
    // The room limit was hit between our list and our create, meaning a new
    // room just opened - back off briefly, then loop around and join it.
    await backoffBeforeRetry(attempt)
  }

  throw new ConflictException('No seat is available right now, try again')
}

/**
 * Opens a room owned by the caller without joining another open room first.
 * This is the lobby "+ Room" intent; quick start still goes through `seatUser`.
 *
 * @param {{ id: number, username: string }} user
 * @param {{ capacity?: number }} [options]
 * @returns {Promise<Object>} the opened room DTO
 */
const createRoom = async (user, { capacity } = {}) => {
  validateCapacity(capacity)

  const currentRoom = await findActiveOwnerRoom(user.id, {
    openRoomMessage: 'Leave your current room before opening a new one',
    inGameMessage: 'You are already in a game room',
  })
  if (currentRoom) {
    return currentRoom
  }

  return openRoomForOwner(user, {
    capacity,
    openRoomMessage: 'Leave your current room before opening a new one',
    inGameMessage: 'You are already in a game room',
  })
}

/**
 * Opens a new room for a specific owner without falling through to another
 * open room. Used by development tools that need a seeded owner in the lobby
 * grid while keeping the real join path intact.
 *
 * @param {{ id: number, username: string }} owner
 * @param {{ capacity?: number, name?: string }} [options]
 * @returns {Promise<Object>} the opened room DTO
 */
const createRoomForOwner = async (owner, { capacity, name } = {}) => {
  validateCapacity(capacity)

  const currentRoom = await findActiveOwnerRoom(owner.id, {
    openRoomMessage: 'Leave the current room before opening a new one',
    inGameMessage: 'That owner is already in a game room',
  })
  if (currentRoom) {
    return currentRoom
  }

  return openRoomForOwner(owner, {
    capacity,
    name,
    openRoomMessage: 'Leave the current room before opening a new one',
    inGameMessage: 'That owner is already in a game room',
  })
}

/**
 * Opens a room for a server-arranged pairing (a tournament match) and seats
 * every player immediately. Unlike the user-facing creation paths there is no
 * "already in a room" refusal: any OPEN seat a player still holds is released
 * first, so the room is born full without breaking the one-active-room
 * invariant — and that same invariant then blocks these players from seating
 * anywhere else while the match runs. The first player owns the room. The
 * caller starts the match right away, so the room is never offered to
 * strangers in the lobby.
 *
 * @param {{ name: string, playerIds: number[] }} pairing players in seat order
 * @returns {Promise<Object>} the full room DTO, ready to claim for a game
 */
const createRoomForMatch = async ({ name, playerIds }) => {
  for (const userId of playerIds) {
    await leaveOpenRoom(userId)
  }
  const room = await roomRepository.createRoomWithPlayers({
    name,
    capacity: playerIds.length,
    ownerId: playerIds[0],
    playerIds,
  })
  return toRoomDto(room)
}

/**
 * Fills the caller's open room with server-owned bot users. Only the room owner
 * can fill empty seats, so another seated user cannot unexpectedly start the
 * owner's room. Bot seats use the same serializable RoomPlayer insert path as
 * human joins.
 *
 * @param {number} ownerUserId
 * @returns {Promise<Object>} the filled room DTO
 */
const fillOpenRoomWithBots = async (ownerUserId) => {
  const currentRoom = await roomRepository.findOpenRoomByUserId(ownerUserId)
  if (!currentRoom) {
    throw new ConflictException('Open a room before adding bot players')
  }
  if (currentRoom.ownerId !== ownerUserId) {
    throw new ConflictException('Only the room owner can add bot players')
  }

  let roomDto = toRoomDto(currentRoom)
  if (isRoomFull(roomDto)) return roomDto

  const candidates = await botPlayers.ensureBotPlayers(
    botPlayers.getBotPoolSize(),
  )
  for (const candidate of candidates) {
    if (isRoomFull(roomDto)) return roomDto
    if (roomDto.players.some((player) => player.userId === candidate.id)) {
      continue
    }

    const activeBotRoom = await roomRepository.findActiveRoomByUserId(
      candidate.id,
    )
    if (activeBotRoom && activeBotRoom.id !== roomDto.id) continue

    const { room, error } = await roomRepository.addPlayerToRoom(
      roomDto.id,
      candidate.id,
    )
    if (room) {
      roomDto = toRoomDto(room)
      continue
    }
    if (
      error === roomRepository.ROOM_ERRORS.CONFLICT ||
      error === roomRepository.ROOM_ERRORS.FULL
    ) {
      const refreshedRoom =
        await roomRepository.findOpenRoomByUserId(ownerUserId)
      if (!refreshedRoom) break
      roomDto = toRoomDto(refreshedRoom)
      continue
    }
    throw new ConflictException('That room is no longer available')
  }

  if (!isRoomFull(roomDto)) {
    throw new ConflictException('No bot seats are available right now')
  }
  return roomDto
}

/**
 * Joins a user into a specific open room by id (the lobby grid's "join this
 * room" for a configurable room someone else created). Idempotent: if the
 * user already holds a seat somewhere, that seat is returned. Refuses when the
 * room is gone, no longer open, or already full.
 *
 * @param {{ id: number }} user
 * @param {number} roomId
 * @returns {Promise<Object>} the room DTO the user is now seated in
 */
const joinRoom = async (user, roomId) => {
  for (let attempt = 0; attempt < SEAT_ATTEMPTS; attempt += 1) {
    const currentRoom = await roomRepository.findActiveRoomByUserId(user.id)
    if (currentRoom) {
      return toRoomDto(currentRoom)
    }

    const { room, error } = await roomRepository.addPlayerToRoom(
      roomId,
      user.id,
    )
    if (room) {
      return toRoomDto(room)
    }
    if (error === roomRepository.ROOM_ERRORS.CONFLICT) {
      // A concurrent seat/leave shifted the room; back off, re-read, retry.
      await backoffBeforeRetry(attempt)
      continue
    }
    // NOT_FOUND, NOT_OPEN, or FULL: the room can no longer be joined.
    throw new ConflictException('That room is no longer available')
  }

  throw new ConflictException('Could not join the room, try again')
}

/**
 * Removes a user from whatever open room they are seated in. Safe to call for
 * users who are not in any room (e.g. on every socket disconnect). An emptied
 * room closes; if the owner leaves, ownership passes to the earliest joiner.
 *
 * @param {number} userId
 * @returns {Promise<boolean>} true if a room changed and clients should be
 *   sent a fresh room list
 */
const leaveOpenRoom = async (userId) => {
  for (let attempt = 0; attempt < LEAVE_ATTEMPTS; attempt += 1) {
    const room = await roomRepository.findOpenRoomByUserId(userId)
    if (!room) {
      return attempt > 0
    }

    const { error } = await roomRepository.removePlayerFromRoom(room.id, userId)
    if (!error) {
      return true
    }
    // A concurrent seat/leave touched the room; re-read and try again so a
    // disconnecting player never lingers as a ghost occupant.
  }
  return false
}

/**
 * Flips a room to IN_GAME and ties it to the runtime game id.
 */
const markRoomInGame = async (roomId, gameId) => {
  const room = await roomRepository.setRoomInGame(roomId, gameId)
  return toRoomDto(room)
}

/**
 * Claims a full OPEN room for a match start (#232). Socket.io runs handlers
 * concurrently, so two seats of the last free slot both observe a full OPEN
 * room; the claim is a compare-and-set and exactly one caller wins it. The
 * winner follows up with markRoomInGame once the engine exists, or
 * releaseRoomClaim if the start failed.
 *
 * @param {number} roomId
 * @returns {Promise<boolean>} true when this caller may start the match
 */
const claimRoomForGame = (roomId) => roomRepository.claimRoomForGame(roomId)

/**
 * Reopens a claimed room whose match start failed, so a member leaving or
 * the next seat retries the start.
 * @param {number} roomId
 */
const releaseRoomClaim = async (roomId) => {
  await roomRepository.reopenClaimedRoom(roomId)
}

/**
 * The owner's explicit "End the room" action (#221): closes the OPEN room the
 * caller owns and returns its DTO so the caller can bounce every seated player
 * back to the lobby. Refuses when the caller is not the owner, the room has
 * already started a game, or nothing was open to close.
 *
 * @param {number} userId
 * @returns {Promise<Object|null>} the closed room's DTO, or null when the
 *   caller may not end it
 */
const endOwnedRoom = async (userId) => {
  const room = await roomRepository.findActiveRoomByUserId(userId)
  if (!room || room.status !== 'OPEN' || room.ownerId !== userId) {
    return null
  }
  const closed = await roomRepository.closeOpenRoomById(room.id)
  if (closed === 0) {
    return null
  }
  return toRoomDto(room)
}

/**
 * Reopens the room behind a game for the players left behind when one leaves
 * the match (an intentional forfeit or an expired reconnect). The leaver and
 * any bots are unseated; a human survivor keeps the room, which flips back to
 * OPEN so it refills for a fresh game, while a room with no humans left closes.
 *
 * Idempotent against a game that already ended: the reopen is guarded on the
 * room still being IN_GAME, and a missing room returns null.
 *
 * @param {string} gameId runtime game UUID
 * @param {number} leaverUserId the player who left
 * @returns {Promise<{ room: Object, reopened: boolean } | null>} the room DTO
 *   and whether survivors kept it open, or null when there was nothing to reopen
 */
const reopenRoomForSurvivors = async (gameId, leaverUserId) => {
  if (!gameId) return null

  const room = await roomRepository.findActiveRoomByGameId(gameId)
  if (!room) return null

  // Bots never wait in the lobby, so they leave with the departing player; the
  // room reopens for its human survivors only (and closes if none remain).
  const removeUserIds = room.players
    .map((player) => player.user.id)
    .filter(
      (userId) => userId === leaverUserId || botPlayers.isBotUserId(userId),
    )

  const { room: updatedRoom, reopened } =
    await roomRepository.reopenRoomForRematch(room.id, removeUserIds)
  if (!updatedRoom) return null

  return { room: toRoomDto(updatedRoom), reopened }
}

/**
 * Closes the room(s) attached to a finished or abandoned game.
 *
 * @param {string} gameId runtime game UUID
 * @returns {Promise<boolean>} true if any room was closed
 */
const closeRoomsForGame = async (gameId) => {
  if (!gameId) {
    return false
  }
  const closedCount = await roomRepository.closeRoomsByGameId(gameId)
  return closedCount > 0
}

/**
 * Closes one open room and returns the room as it was before closing so callers
 * can notify seated players.
 *
 * @param {number} roomId
 * @returns {Promise<Object|null>} the closed room DTO, or null if it was not open
 */
const closeOpenRoomById = async (roomId) => {
  const room = (await roomRepository.findVisibleRooms()).find(
    (candidate) => candidate.id === roomId && candidate.status === 'OPEN',
  )
  if (!room) return null
  const closed = await roomRepository.closeOpenRoomById(roomId)
  return closed > 0 ? toRoomDto(room) : null
}

module.exports = {
  toRoomDto,
  isRoomFull,
  listRooms,
  seatUser,
  createRoom,
  createRoomForOwner,
  createRoomForMatch,
  fillOpenRoomWithBots,
  joinRoom,
  leaveOpenRoom,
  markRoomInGame,
  claimRoomForGame,
  releaseRoomClaim,
  endOwnedRoom,
  closeRoomsForGame,
  reopenRoomForSurvivors,
  closeOpenRoomById,
}
