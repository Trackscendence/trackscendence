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
    playable: false,
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
  currentColor: 'blue',
  direction: 'clockwise',
  deckSize: 51,
  pendingDraw: 3,
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

const getCurrentPlayer = (handSize) => ({
  ...currentPlayer,
  cards:
    handSize == null
      ? bottomHand
      : bottomHand.slice(0, Math.min(handSize, bottomHand.length)),
})

const createState = (opponentSeats, options = {}) => ({
  ...baseState,
  direction: options.direction ?? baseState.direction,
  pendingDraw: options.pendingDraw ?? baseState.pendingDraw,
  players: [
    getCurrentPlayer(options.handSize),
    ...opponentSeats.map((seat) => opponentBySeat[seat]),
  ],
})

const MOCK_PLAYER_SEATS = {
  2: ['top'],
  3: ['top', 'left'],
  4: ['top', 'left', 'right'],
}

const getPlayerSeats = (playerCount) => {
  return MOCK_PLAYER_SEATS[playerCount] ?? MOCK_PLAYER_SEATS[4]
}

export const getMockGameState = ({
  direction,
  handSize,
  pendingDraw,
  playerCount = 4,
} = {}) => {
  return createState(getPlayerSeats(playerCount), {
    direction,
    handSize,
    pendingDraw,
  })
}

export default {
  2: createState(MOCK_PLAYER_SEATS[2]),
  3: createState(MOCK_PLAYER_SEATS[3]),
  4: createState(MOCK_PLAYER_SEATS[4]),
}
