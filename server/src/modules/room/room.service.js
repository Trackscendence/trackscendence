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
} = require('#modules/room/room.constants')
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
 * Seats a user for a game. Idempotent: re-uses the open room they are
 * already in, else joins the first open room with a free seat, else creates a
 * new room with them as owner (subject to MAX_OPEN_ROOMS).
 *
 * @param {{ id: number, username: string }} user
 * @returns {Promise<Object>} the room DTO the user is seated in; the caller
 *   checks `isRoomFull` on it to decide whether the match should start
 */
const seatUser = async (user) => {
  for (let attempt = 0; attempt < SEAT_ATTEMPTS; attempt += 1) {
    const currentRoom = await roomRepository.findOpenRoomByUserId(user.id)
    if (currentRoom) {
      return toRoomDto(currentRoom)
    }

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

    const { room: createdRoom } = await roomRepository.createRoomIfUnderLimit({
      name: `${user.username}'s room`,
      capacity: DEFAULT_CAPACITY,
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
  leaveOpenRoom,
  markRoomInGame,
  closeRoomsForGame,
}
