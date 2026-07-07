const toFiniteNumber = (value) => {
  if (value == null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const ROOM_CLOSED_ACTIONS = {
  clear: 'clear',
  ignore: 'ignore',
  navigate: 'navigate',
}

export const getRoomClosedAction = ({
  closedRoomId,
  currentRoomId,
  seatIntent,
}) => {
  if (!closedRoomId) return ROOM_CLOSED_ACTIONS.ignore

  const normalizedClosedRoomId =
    closedRoomId === true ? null : toFiniteNumber(closedRoomId)
  const normalizedCurrentRoomId = toFiniteNumber(currentRoomId)

  if (normalizedCurrentRoomId != null) {
    if (
      normalizedClosedRoomId == null ||
      normalizedClosedRoomId === normalizedCurrentRoomId
    ) {
      return ROOM_CLOSED_ACTIONS.navigate
    }
    return ROOM_CLOSED_ACTIONS.clear
  }

  if (seatIntent?.type === 'join') {
    const joinedRoomId = toFiniteNumber(seatIntent.roomId)
    if (
      joinedRoomId != null &&
      normalizedClosedRoomId != null &&
      joinedRoomId === normalizedClosedRoomId
    ) {
      return ROOM_CLOSED_ACTIONS.navigate
    }
  }

  return ROOM_CLOSED_ACTIONS.clear
}
