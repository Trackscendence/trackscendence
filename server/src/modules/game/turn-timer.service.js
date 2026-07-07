const config = require('#utils/config')

// Per-game turn deadline timers, keyed by gameId. Mirrors the bot-turn timer
// registry (bot-turn.service.js): one handle per game, injectable schedule and
// cancel so tests drive the clock. This module is deliberately dumb. It manages
// the Map and the clock only; every game decision (who timed out, what to draw,
// whether to hand off to a bot) lives in the caller's onExpire handler.
const turnTimers = new Map()

const clearTurnTimer = (gameId, cancel = clearTimeout) => {
  const timer = turnTimers.get(gameId)
  if (!timer) return
  cancel(timer)
  turnTimers.delete(gameId)
}

const clearAllTurnTimers = (cancel = clearTimeout) => {
  for (const [gameId, timer] of turnTimers.entries()) {
    cancel(timer)
    turnTimers.delete(gameId)
  }
}

const getScheduledTurnTimerCount = () => turnTimers.size

/**
 * Arms a single turn-deadline timer for a game. Clear-and-replace, so a game
 * never holds two timers at once. When the window elapses the timer removes
 * itself from the registry and calls onExpire(gameId); the caller guards the
 * rest (nonce check, applyTurnTimeout, broadcast, re-arm).
 *
 * @param {Object} params
 * @param {string} params.gameId
 * @param {(gameId: string) => void} params.onExpire
 * @param {number} [params.durationMs] - defaults to config.TURN_TIMER_MS
 * @param {Function} [params.schedule] - defaults to setTimeout
 * @param {Function} [params.cancel] - defaults to clearTimeout
 */
const armTurnTimer = ({
  gameId,
  onExpire,
  durationMs = config.TURN_TIMER_MS,
  schedule = setTimeout,
  cancel = clearTimeout,
}) => {
  clearTurnTimer(gameId, cancel)

  const timer = schedule(() => {
    turnTimers.delete(gameId)
    onExpire(gameId)
  }, durationMs)

  turnTimers.set(gameId, timer)
}

module.exports = {
  armTurnTimer,
  clearTurnTimer,
  clearAllTurnTimers,
  getScheduledTurnTimerCount,
}
