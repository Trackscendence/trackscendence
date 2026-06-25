const bottomHand = [
  {
    id: 'you-blue-5',
    color: 'blue',
    type: 'number',
    value: 5,
    playable: true,
  },
  {
    id: 'you-red-draw-2',
    color: 'red',
    type: 'draw2',
    playable: true,
  },
  {
    id: 'you-wild',
    color: 'wild',
    type: 'wild',
    playable: true,
  },
  {
    id: 'you-green-skip',
    color: 'green',
    type: 'skip',
    playable: false,
  },
  {
    id: 'you-yellow-9',
    color: 'yellow',
    type: 'number',
    value: 9,
    playable: false,
  },
]

const baseState = {
  id: 'mock-game-120',
  currentTurnPlayerId: 'player-2',
  currentColor: 'wild',
  direction: 'clockwise',
  deckSize: 51,
  topCard: {
    id: 'discard-wild-draw-3',
    color: 'wild',
    type: 'wild_draw3',
    playable: false,
  },
}

const currentPlayer = {
  id: 'you',
  username: 'You',
  seat: 'bottom',
  cards: bottomHand,
}

const opponentBySeat = {
  top: {
    id: 'player-2',
    username: 'Player 2',
    seat: 'top',
    cardCount: 4,
  },
  left: {
    id: 'player-1',
    username: 'Player 1',
    seat: 'left',
    cardCount: 4,
  },
  right: {
    id: 'player-3',
    username: 'Player 3',
    seat: 'right',
    cardCount: 4,
  },
}

const createState = (opponentSeats) => ({
  ...baseState,
  players: [
    currentPlayer,
    ...opponentSeats.map((seat) => opponentBySeat[seat]),
  ],
})

const MOCK_GAME_STATES = {
  2: createState(['top']),
  3: createState(['top', 'left']),
  4: createState(['top', 'left', 'right']),
}

export const getMockGameState = (playerCount = 4) => {
  return MOCK_GAME_STATES[playerCount] ?? MOCK_GAME_STATES[4]
}

export default MOCK_GAME_STATES
