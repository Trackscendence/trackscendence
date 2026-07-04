/**
 * Mock matchmaking driver.
 *
 * Simulates the #88 socket contract (`join_lobby` -> `lobby_update` ->
 * `game_start`) so the pre-game waiting room can be built and demoed before the
 * matchmaking backend merges to `dev`. The callback shape mirrors the server
 * events exactly, so wiring the real socket later is a matter of replacing the
 * timer below with `socket.on('lobby_update', ...)` / `socket.on('game_start',
 * ...)` — no change to callers.
 */

// How long the mock waits before a second player "joins" and the match forms.
const MATCH_DELAY_MS = 3500

const MOCK_OPPONENT = {
  userId: 'mock-opponent',
  username: 'Robin Vega',
}

/**
 * Enters the mock queue. Reports the queue count immediately (you), then, after
 * a short delay, an opponent joins and the match starts.
 *
 * @param {Object} params
 * @param {{ id: string, username: string }} params.me
 * @param {(count: number) => void} params.onLobbyUpdate
 * @param {(game: { gameId: string, players: Array<{ userId: string, username: string }> }) => void} params.onGameStart
 * @returns {() => void} cancel function that leaves the queue
 */
export const joinMatchmaking = ({ me, onLobbyUpdate, onGameStart }) => {
  // You are queued immediately.
  onLobbyUpdate(1)

  const opponentTimer = setTimeout(() => {
    onLobbyUpdate(2)
    onGameStart({
      gameId: 'mock-game',
      players: [{ userId: me.id, username: me.username }, MOCK_OPPONENT],
    })
  }, MATCH_DELAY_MS)

  return () => clearTimeout(opponentTimer)
}
