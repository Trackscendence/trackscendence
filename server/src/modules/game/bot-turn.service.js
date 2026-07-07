const gameStore = require('#modules/game/game.store')
const botPlayers = require('#modules/game/bot-player.service')
const logger = require('#utils/logger')

const BOT_TURN_DELAY_MS = 700
const botTurnTimers = new Map()

const clearBotTurnTimer = (gameId, cancel = clearTimeout) => {
  const timer = botTurnTimers.get(gameId)
  if (!timer) return
  cancel(timer)
  botTurnTimers.delete(gameId)
}

const clearAllBotTurnTimers = (cancel = clearTimeout) => {
  for (const [gameId, timer] of botTurnTimers.entries()) {
    cancel(timer)
    botTurnTimers.delete(gameId)
  }
}

const getScheduledBotTurnCount = () => botTurnTimers.size

const scheduleBotTurn = ({
  io,
  gameId,
  broadcastGameState,
  checkGameEnd,
  schedule = setTimeout,
  cancel = clearTimeout,
  delayMs = BOT_TURN_DELAY_MS,
}) => {
  clearBotTurnTimer(gameId, cancel)

  const engine = gameStore.getEngine(gameId)
  if (!engine || engine.winner) return false

  const { currentPlayer } = engine.getState()
  if (!botPlayers.isBotUserId(currentPlayer)) return false

  const timer = schedule(async () => {
    botTurnTimers.delete(gameId)

    const liveEngine = gameStore.getEngine(gameId)
    if (!liveEngine || liveEngine.winner) return

    const { currentPlayer: livePlayer } = liveEngine.getState()
    if (!botPlayers.isBotUserId(livePlayer)) return

    try {
      botPlayers.playNextAction(liveEngine)
      broadcastGameState(io, gameId, liveEngine)
      await checkGameEnd(gameId, liveEngine)
    } catch (error) {
      logger.error(`Failed to play bot turn for game ${gameId}`, error)
      return
    }

    const nextEngine = gameStore.getEngine(gameId)
    if (!nextEngine || nextEngine.winner) return
    scheduleBotTurn({
      io,
      gameId,
      broadcastGameState,
      checkGameEnd,
      schedule,
      cancel,
      delayMs,
    })
  }, delayMs)

  botTurnTimers.set(gameId, timer)
  return true
}

module.exports = {
  clearAllBotTurnTimers,
  clearBotTurnTimer,
  getScheduledBotTurnCount,
  scheduleBotTurn,
}
