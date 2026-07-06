// A recognizable gameId so dev tooling only ever touches games it injected
// itself. The mock opponent's match and the game simulation share it, so the
// waiting-room handoff (navigate to /game?gameId=dev-mock) lines up with the
// simulated state the game page then finds in the store.
export const DEV_GAME_ID = 'dev-mock'
