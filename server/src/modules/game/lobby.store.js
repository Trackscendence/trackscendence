/**
 * LobbyStore - Matchmaking queue of players waiting for a game.
 *
 * The queue stores plain, serializable identities ({ userId, username }) keyed
 * by userId - never live socket objects. This keeps the store independent of
 * transport liveness and consistent with the "seamless swap to Redis" contract
 * in game.store.js (sockets are not serializable; identities are). Handlers
 * resolve sockets when needed via the `user:${userId}` rooms.
 */

// userId -> { userId, username }
const lobbyQueue = new Map()

/**
 * Adds a player identity to the queue. Idempotent per userId.
 * @param {{ id: string, username: string }} user
 */
const addPlayer = (user) => {
  if (!lobbyQueue.has(user.id)) {
    lobbyQueue.set(user.id, { userId: user.id, username: user.username })
  }
}

/**
 * Re-queues players at the front, preserving the existing order behind them.
 * Used to roll back a match attempt that failed to start.
 * @param {Array<{ userId: string, username: string }>} players
 */
const addPlayersToFront = (players) => {
  const waitingPlayers = Array.from(lobbyQueue.values())
  lobbyQueue.clear()
  players.forEach((player) => lobbyQueue.set(player.userId, player))
  waitingPlayers.forEach((player) => lobbyQueue.set(player.userId, player))
}

/**
 * Removes a player from the queue by id.
 * @param {string} userId
 */
const removePlayer = (userId) => {
  lobbyQueue.delete(userId)
}

const getLobbyCount = () => {
  return lobbyQueue.size
}

/**
 * Removes and returns the first `count` players from the front of the queue.
 * @param {number} count
 * @returns {Array<{ userId: string, username: string }>}
 */
const extractMatchPlayers = (count) => {
  const matchPlayers = Array.from(lobbyQueue.values()).slice(0, count)
  matchPlayers.forEach((player) => lobbyQueue.delete(player.userId))
  return matchPlayers
}

module.exports = {
  addPlayer,
  addPlayersToFront,
  removePlayer,
  getLobbyCount,
  extractMatchPlayers,
}
