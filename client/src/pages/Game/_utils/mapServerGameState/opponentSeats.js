const OPPONENT_SEATS_BY_COUNT = {
  1: ['top'],
  2: ['left', 'right'],
  3: ['top', 'left', 'right'],
  4: ['top-left', 'top-right', 'left', 'right'],
  5: ['top-left', 'top', 'top-right', 'left', 'right'],
}

export const getOpponentSeats = (opponentCount) => {
  return OPPONENT_SEATS_BY_COUNT[opponentCount] ?? OPPONENT_SEATS_BY_COUNT[5]
}
