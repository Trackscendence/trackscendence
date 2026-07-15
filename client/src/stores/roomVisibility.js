const MAX_REMEMBERED_ROOM_IDS = 20

const normalizeRoomId = (roomId) => {
  const number = Number(roomId)
  return Number.isFinite(number) ? number : null
}

export const getOwnRoomIds = (rooms, ownUserId) => {
  if (!ownUserId) return []

  return rooms
    .filter((room) =>
      room.players.some((player) => player.userId === ownUserId),
    )
    .map((room) => normalizeRoomId(room.id))
    .filter((roomId) => roomId != null)
}

export const rememberRoomIds = (currentRoomIds, roomIds) => {
  const nextRoomIds = [...currentRoomIds]

  roomIds.forEach((roomId) => {
    const normalizedRoomId = normalizeRoomId(roomId)
    if (normalizedRoomId == null || nextRoomIds.includes(normalizedRoomId)) {
      return
    }
    nextRoomIds.push(normalizedRoomId)
  })

  return nextRoomIds.slice(-MAX_REMEMBERED_ROOM_IDS)
}

export const resolveVisibleRooms = ({
  rooms,
  ownUserId,
  pendingLeftRoomIds = [],
  suppressedClosedRoomIds,
}) => {
  const closedRoomIds = new Set(suppressedClosedRoomIds)
  const roomsWithoutClosed = rooms.filter(
    (room) => !closedRoomIds.has(normalizeRoomId(room.id)),
  )

  // A room the player left stays hidden only while a snapshot still shows them
  // seated in it — such a snapshot predates the leave. The first snapshot
  // without their seat expires the id, so the room (now someone else's)
  // renders normally again. Tracking ids instead of a boolean means starting
  // the next create cannot un-hide the previous room (#429).
  const showsOwnSeat = (room) =>
    !!ownUserId && room.players.some((player) => player.userId === ownUserId)
  const stillPendingRoomIds = pendingLeftRoomIds.filter((pendingRoomId) =>
    roomsWithoutClosed.some(
      (room) =>
        normalizeRoomId(room.id) === pendingRoomId && showsOwnSeat(room),
    ),
  )

  const visibleRooms = roomsWithoutClosed.filter(
    (room) => !stillPendingRoomIds.includes(normalizeRoomId(room.id)),
  )

  if (stillPendingRoomIds.length === pendingLeftRoomIds.length) {
    return { rooms: visibleRooms }
  }
  return { rooms: visibleRooms, pendingLeftRoomIds: stillPendingRoomIds }
}
