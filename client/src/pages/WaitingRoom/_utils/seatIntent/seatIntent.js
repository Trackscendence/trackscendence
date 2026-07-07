const MAX_CLAIMED_SEAT_INTENTS = 20
const claimedSeatIntentKeys = new Set()

export const getSeatIntentKey = (seatIntent) => {
  if (!seatIntent || typeof seatIntent !== 'object') return null

  if (seatIntent.type === 'join') {
    const roomId = Number(seatIntent.roomId)
    return Number.isFinite(roomId) ? `join:${roomId}` : null
  }

  if (seatIntent.type === 'create') {
    if (seatIntent.capacity == null) return 'create:default'
    const capacity = Number(seatIntent.capacity)
    return Number.isFinite(capacity) ? `create:${capacity}` : null
  }

  return null
}

export const claimSeatIntent = (seatIntent, locationKey) => {
  const seatIntentKey = getSeatIntentKey(seatIntent)
  if (!seatIntentKey) return false

  const scopedKey = `${locationKey || 'current'}:${seatIntentKey}`
  if (claimedSeatIntentKeys.has(scopedKey)) return false

  claimedSeatIntentKeys.add(scopedKey)
  while (claimedSeatIntentKeys.size > MAX_CLAIMED_SEAT_INTENTS) {
    const oldestKey = claimedSeatIntentKeys.values().next().value
    claimedSeatIntentKeys.delete(oldestKey)
  }
  return true
}

export const resetSeatIntentClaimsForTests = () => {
  claimedSeatIntentKeys.clear()
}
