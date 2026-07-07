export const getSeatIntentKey = (seatIntent) => {
  if (!seatIntent || typeof seatIntent !== 'object') return null

  if (seatIntent.type === 'join') {
    const roomId = Number(seatIntent.roomId)
    return Number.isFinite(roomId) ? `join:${roomId}` : null
  }

  if (seatIntent.type === 'create') {
    const capacity = Number(seatIntent.capacity)
    return Number.isFinite(capacity) ? `create:${capacity}` : null
  }

  return null
}
