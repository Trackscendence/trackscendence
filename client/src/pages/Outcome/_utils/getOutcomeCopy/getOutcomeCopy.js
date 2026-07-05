// Maps a match result to the headline, subtitle, and whether to celebrate.
// `celebrate` gates the confetti; `delta` is the rank change shown on the
// player's leaderboard row (a win nudges you up, a loss down — abandoned games
// don't count). Copy is active and forward-looking: a loss says "Try Again",
// never "Game Over", because the next action is to play again.
const OUTCOME_COPY = {
  won: {
    title: 'You Won!',
    subtitle: "You took the round. Here's where you land.",
    celebrate: true,
    delta: 1,
  },
  lost: {
    title: 'Try Again',
    subtitle: 'So close. Line one up and run it back.',
    celebrate: false,
    delta: -1,
  },
  abandoned: {
    title: 'Game Over',
    subtitle: 'The match ended early. No result was recorded.',
    celebrate: false,
    delta: 0,
  },
}

const getOutcomeCopy = (outcome) => OUTCOME_COPY[outcome] ?? OUTCOME_COPY.won

export default getOutcomeCopy
