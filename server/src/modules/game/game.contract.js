/**
 * The realtime game contract lives here so the wire shape has one definition
 * and one place to regression-test. `buildGameStatePayload` is the exact body
 * the server emits as `game_state_update` to a single player: the engine's
 * public state (which exposes only hand *sizes*), plus that one player's own
 * hand. It must never carry another player's cards — see game.contract.test.js.
 */

/**
 * @param {Object} params
 * @param {import('./game.engine')} params.engine
 * @param {string} params.gameId
 * @param {number|string} params.playerId the recipient; only their hand is included
 * @returns {Object} the game_state_update payload for that player
 */
const buildGameStatePayload = ({ engine, gameId, playerId }) => ({
  ...engine.getState(),
  myHand: engine.getHand(playerId),
  gameId,
})

module.exports = { buildGameStatePayload }
