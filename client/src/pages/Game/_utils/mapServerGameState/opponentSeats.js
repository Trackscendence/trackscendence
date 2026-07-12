const OPPONENT_SEATS_BY_COUNT = {
  1: ['top'],
  2: ['left', 'right'],
  3: ['left', 'top', 'right'],
  4: ['left', 'top-left', 'top-right', 'right'],
  5: ['left', 'top-left', 'top', 'top-right', 'right'],
}

export const getOpponentSeats = (opponentCount) => {
  return OPPONENT_SEATS_BY_COUNT[opponentCount] ?? OPPONENT_SEATS_BY_COUNT[5]
}
