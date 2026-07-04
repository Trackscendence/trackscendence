/**
 * MatchmakingService - Decides when a queued set of players becomes a game.
 *
 * The matchmaking policy ("start a match when enough players are queued") lives
 * here rather than inside a socket handler, so it can be unit-tested and reused
 * without a running Socket.IO server - the coupling issue #88 set out to fix.
 * This module knows nothing about sockets; the handler layer is responsible for
 * moving players between rooms and emitting events from the result.
 */

const crypto = require('node:crypto')
const lobbyStore = require('#modules/game/lobby.store')
const gameStore = require('#modules/game/game.store')
const UnoEngine = require('#modules/game/game.engine')
const logger = require('#utils/logger')

const REQUIRED_PLAYERS = 2

/**
 * Attempts to form and start a single match from the front of the lobby queue.
 *
 * @returns {Promise<{ gameId: string, players: Array<{userId: string, username: string}>, engine: UnoEngine } | null>}
 *   The started match, or null if there are not enough queued players.
 * @throws Re-throws if game persistence fails, after rolling the players back to
 *   the front of the queue so they are never dropped.
 */
const tryStartMatch = async () => {
  if (lobbyStore.getLobbyCount() < REQUIRED_PLAYERS) {
    return null
  }

  const players = lobbyStore.extractMatchPlayers(REQUIRED_PLAYERS)
  const gameId = crypto.randomUUID()
  const gameState = {
    id: gameId,
    status: 'IN_PROGRESS',
    players,
    startedAt: new Date(),
  }

  try {
    await gameStore.saveGame(gameId, gameState)
  } catch (error) {
    // Never lose queued players: put them back at the front and let the caller
    // decide how to surface the failure.
    lobbyStore.addPlayersToFront(players)
    throw error
  }

  const engine = new UnoEngine(players.map((player) => player.userId))
  gameStore.setEngine(gameId, engine)

  return { gameId, players, engine }
}

/**
 * Handles a player leaving while a game is in progress. Marks the game as
 * abandoned, tears down its engine, and returns the affected game so the caller
 * can notify the remaining players. Returns null if the player was not in an
 * active game. This is the backend hook the post-game "abandoned" state (#155)
 * will build on.
 *
 * @param {string} userId
 * @returns {Promise<Object|null>} the abandoned game, or null
 */
const handlePlayerDisconnect = async (userId) => {
  const game = await gameStore.findActiveGameByUser(userId, {
    status: 'IN_PROGRESS',
  })
  if (!game) {
    return null
  }

  game.status = 'ABANDONED'
  game.abandonedBy = userId
  game.endedAt = new Date()
  await gameStore.saveGame(game.id, game)
  gameStore.deleteEngine(game.id)

  logger.info(`Game ${game.id} abandoned by ${userId}`)
  return game
}

module.exports = {
  REQUIRED_PLAYERS,
  tryStartMatch,
  handlePlayerDisconnect,
}
