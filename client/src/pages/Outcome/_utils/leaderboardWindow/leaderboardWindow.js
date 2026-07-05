// Builds the results-screen snapshot: the player's row with two ranks above and
// two below (five rows), so they see exactly where they landed without opening
// the full leaderboard. If the player isn't ranked yet, fall back to the top of
// the table. `delta` is stamped onto the player's own row only.
const WINDOW_RADIUS = 2

const leaderboardWindow = ({ leaderboard = [], currentUserId, delta = 0 }) => {
  const withDelta = leaderboard.map((entry) =>
    entry.userId === currentUserId ? { ...entry, delta } : entry,
  )

  const playerIndex = withDelta.findIndex(
    (entry) => entry.userId === currentUserId,
  )

  if (playerIndex === -1) {
    return withDelta.slice(0, WINDOW_RADIUS * 2 + 1)
  }

  const start = Math.max(0, playerIndex - WINDOW_RADIUS)
  return withDelta.slice(start, start + WINDOW_RADIUS * 2 + 1)
}

export default leaderboardWindow
