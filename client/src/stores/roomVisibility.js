const MAX_SUPPRESSED_CLOSED_ROOM_IDS = 20

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

export const rememberClosedRoomIds = (currentRoomIds, roomIds) => {
  const nextRoomIds = [...currentRoomIds]

  roomIds.forEach((roomId) => {
    const normalizedRoomId = normalizeRoomId(roomId)
    if (normalizedRoomId == null || nextRoomIds.includes(normalizedRoomId)) {
      return
    }
    nextRoomIds.push(normalizedRoomId)
  })

  return nextRoomIds.slice(-MAX_SUPPRESSED_CLOSED_ROOM_IDS)
}

export const resolveVisibleRooms = ({
  rooms,
  ownUserId,
  suppressOwnRoom,
  suppressedClosedRoomIds,
}) => {
  const closedRoomIds = new Set(suppressedClosedRoomIds)
  const roomsWithoutClosed = rooms.filter(
    (room) => !closedRoomIds.has(normalizeRoomId(room.id)),
  )

  if (!suppressOwnRoom) {
    return { rooms: roomsWithoutClosed }
  }

  const stillSeated =
    !!ownUserId &&
    roomsWithoutClosed.some((room) =>
      room.players.some((player) => player.userId === ownUserId),
    )

  if (!stillSeated) {
    return { rooms: roomsWithoutClosed, suppressOwnRoom: false }
  }

  return {
    rooms: roomsWithoutClosed.filter(
      (room) => !room.players.some((player) => player.userId === ownUserId),
    ),
  }
}
