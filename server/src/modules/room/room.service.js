/**
 * RoomService - Lifecycle of persistent game rooms.
 *
 * A room is the durable record of "who is gathering to play": it has an owner,
 * a capacity, seated players, and a status (OPEN -> IN_GAME -> CLOSED). The
 * entry point is `seatUser`, the auto-seat behind the waiting room: whoever
 * arrives first creates the room and owns it, everyone after that joins.
 * The service owns the seating policy; the socket layer decides when a full
 * room becomes a running match. See docs/erm/room.md for the data model.
 */

const roomRepository = require('#modules/room/room.repository')
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
// the next pass sees the winner's room and joins or re-uses it.
const SEAT_ATTEMPTS = 3
const LEAVE_ATTEMPTS = 3

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
  })),
})

const isRoomFull = (roomDto) => roomDto.players.length >= roomDto.capacity

/**
 * Rooms the lobby page shows: OPEN and IN_GAME, oldest first.
 * @returns {Promise<Array<Object>>} room DTOs
 */
const listRooms = async () => {
  const rooms = await roomRepository.findVisibleRooms()
  return rooms.map(toRoomDto)
}

/**
 * Seats a user in the single shared room. Idempotent: re-uses the open or
 * in-game room they are already in (so a double-mounted effect or a refresh
 * mid-game never opens a second room for the same player).
 *
 * There is at most one open room at a time. If it exists, everyone joins it,
 * whatever its size — the creator's capacity choice stands. If none exists, the
 * caller opens it: with an explicit `capacity` (the lobby's "create a room for
 * N") at that size, otherwise the default two-player quick game (#156).
 *
 * @param {{ id: number, username: string }} user
 * @param {{ capacity?: number }} [options]
 * @returns {Promise<Object>} the room DTO the user is seated in; the caller
 *   checks `isRoomFull` on it to decide whether the match should start
 */
const seatUser = async (user, { capacity } = {}) => {
  if (capacity !== undefined && !ALLOWED_CAPACITIES.includes(capacity)) {
    throw new BadRequestException('Unsupported room size', {
      details: [`Room size must be one of ${ALLOWED_CAPACITIES.join(', ')}`],
    })
  }

  for (let attempt = 0; attempt < SEAT_ATTEMPTS; attempt += 1) {
    const currentRoom = await roomRepository.findActiveRoomByUserId(user.id)
    if (currentRoom) {
      return toRoomDto(currentRoom)
    }

    // Join the open room if there is one, whatever its size — a single shared
    // room means everyone gathers in the same place.
    const visibleRooms = await roomRepository.findVisibleRooms()
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
    // room just opened - loop around and join it.
  }

  throw new ConflictException('No seat is available right now, try again')
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
      // A concurrent seat/leave shifted the room; re-read and retry.
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

module.exports = {
  toRoomDto,
  isRoomFull,
  listRooms,
  seatUser,
  joinRoom,
  leaveOpenRoom,
  markRoomInGame,
  claimRoomForGame,
  releaseRoomClaim,
  endOwnedRoom,
  closeRoomsForGame,
}
