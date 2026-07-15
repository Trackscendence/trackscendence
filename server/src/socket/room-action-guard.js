const inFlightRoomActions = new Map()
const roomActionQueues = new Map()

/**
 * Runs `action` after every earlier action queued under the same key has
 * settled (a per-user FIFO). Room lifecycle events for one user must not
 * overlap: a `room:create` that overtakes a still-running `room:leave` sees
 * the old seat and hands back the room the player just left (#429). A failed
 * action rejects for its own caller but never blocks the queue behind it.
 *
 * @param {string} key one queue per user
 * @param {() => Promise<*>} action
 * @returns {Promise<*>} resolves with the action's result
 */
const enqueueRoomAction = (key, action, { queues = roomActionQueues } = {}) => {
  const tail = queues.get(key) ?? Promise.resolve()
  const run = tail.then(action)
  const settled = run.then(
    () => {},
    () => {},
  )
  queues.set(key, settled)
  settled.then(() => {
    if (queues.get(key) === settled) queues.delete(key)
  })
  return run
}

/**
 * FIFO-queues `action` like `enqueueRoomAction`, but drops it when another
 * exclusive action for the same key is already pending — the dedupe for a
 * double-clicked seat/create/join, which must be skipped rather than queued
 * (a queued duplicate would re-run against the state the first one created).
 *
 * @param {string} key
 * @param {() => Promise<*>} action
 * @returns {Promise<{skipped: boolean, value?: *}>}
 */
const runExclusiveRoomAction = async (
  key,
  action,
  { inFlight = inFlightRoomActions, queues } = {},
) => {
  if (inFlight.has(key)) return { skipped: true }

  inFlight.set(key, true)
  try {
    return {
      skipped: false,
      value: await enqueueRoomAction(key, action, { queues }),
    }
  } finally {
    inFlight.delete(key)
  }
}

module.exports = {
  enqueueRoomAction,
  runExclusiveRoomAction,
}
