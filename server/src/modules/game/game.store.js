/**
 * GameStore - In-memory manager for live games.
 *
 * This module holds two deliberately separate registries:
 *
 * 1. Game state (`activeGames`) - plain, serializable snapshots
 *    ({ id, status, players, winner, startedAt, endedAt }). These are the
 *    persistent facts about a game. All accessors are async so this half can
 *    be swapped for Redis later without changing any caller.
 *
 * 2. Engine registry (`activeEngines`) - live UnoEngine instances. Engines are
 *    NOT serializable and are intentionally process-local: they live only in
 *    this Node process and are lost on restart. This half will NOT move to
 *    Redis, so its accessors are sync to make that boundary explicit rather
 *    than implying a persistence guarantee it cannot keep. See
 *    docs/adr/0001-in-memory-game-state.md.
 *
 * The engine is the source of truth for in-progress dynamics (turn, hands,
 * winner). `activeGames` mirrors only the durable metadata; callers reconcile
 * the two at game end (winner/status/endedAt) before flushing to PostgreSQL.
 */

// --- Persistent game state (Redis-swappable) --------------------------------

const activeGames = new Map()
const activeEngines = new Map()

/**
 * Creates or updates a game state.
 * @param {string} gameId
 * @param {Object} state
 */
const saveGame = async (gameId, state) => {
  activeGames.set(gameId, state)
}

/**
 * Retrieves a game state.
 * @param {string} gameId
 * @returns {Promise<Object|null>}
 */
const getGame = async (gameId) => {
  return activeGames.get(gameId) || null
}

/**
 * Deletes a game state (e.g., when the game completes and is flushed to DB).
 * @param {string} gameId
 */
const deleteGame = async (gameId) => {
  activeGames.delete(gameId)
}

/**
 * Retrieves all active games.
 * @returns {Promise<Array<Object>>}
 */
const getAllGames = async () => {
  return Array.from(activeGames.values())
}

/**
 * Finds the active game a user is currently part of, if any.
 * @param {string} userId
 * @param {{ status?: string }} [filter] - optional status to match (e.g. 'IN_PROGRESS')
 * @returns {Promise<Object|null>}
 */
const findActiveGameByUser = async (userId, filter = {}) => {
  for (const game of activeGames.values()) {
    if (filter.status && game.status !== filter.status) continue
    if (game.players?.some((player) => player.userId === userId)) return game
  }
  return null
}

// --- Live engine registry (process-local, not serializable) -----------------

/**
 * Stores an UnoEngine instance for a live game. Sync by design: engines are
 * process-local and never persisted (see module header).
 * @param {string} gameId
 * @param {Object} engine
 */
const setEngine = (gameId, engine) => {
  activeEngines.set(gameId, engine)
}

/**
 * Retrieves the UnoEngine instance for a live game.
 * @param {string} gameId
 * @returns {Object|null}
 */
const getEngine = (gameId) => {
  return activeEngines.get(gameId) || null
}

/**
 * Deletes the UnoEngine instance when the game is over.
 * @param {string} gameId
 */
const deleteEngine = (gameId) => {
  activeEngines.delete(gameId)
}

module.exports = {
  saveGame,
  getGame,
  deleteGame,
  getAllGames,
  findActiveGameByUser,
  setEngine,
  getEngine,
  deleteEngine,
}
