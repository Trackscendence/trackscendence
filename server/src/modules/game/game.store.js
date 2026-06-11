/**
 * GameStore - Asynchronous In-Memory Game State Manager
 * 
 * This module manages the active, live games (waiting, in-progress). 
 * All methods are intentionally asynchronous to allow a completely seamless 
 * swap to Redis in the future without changing any consumer code.
 */

const activeGames = new Map()

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
 * Retrieves all active games in the lobby.
 * @returns {Promise<Array<Object>>}
 */
const getAllGames = async () => {
  return Array.from(activeGames.values())
}

module.exports = {
  saveGame,
  getGame,
  deleteGame,
  getAllGames,
}
