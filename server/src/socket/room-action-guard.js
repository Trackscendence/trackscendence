const inFlightRoomActions = new Map()

const runExclusiveRoomAction = async (
  key,
  action,
  { inFlight = inFlightRoomActions } = {},
) => {
  if (inFlight.has(key)) return { skipped: true }

  inFlight.set(key, true)
  try {
    return { skipped: false, value: await action() }
  } finally {
    inFlight.delete(key)
  }
}

module.exports = {
  runExclusiveRoomAction,
}
