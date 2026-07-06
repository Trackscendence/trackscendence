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

const createState = (opponentSeats, options = {}) => {
  const opponents = opponentSeats.map((seat) => opponentBySeat[seat])
  return {
    ...baseState,
    currentTurnPlayerId: opponents[0]?.id ?? currentPlayer.id,
    direction: options.direction ?? baseState.direction,
    pendingDraw: options.pendingDraw ?? baseState.pendingDraw,
    players: [getCurrentPlayer(options.handSize), ...opponents],
  }
}

const MOCK_PLAYER_SEATS = {
  2: ['top'],
  3: ['left', 'right'],
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

// --- Query-param driven mock (dev-only design mode) --------------------------
// The Rig's data-source switch sends the game page here with ?source=mock;
// the remaining params keep every table arrangement reachable by URL.

const SUPPORTED_PLAYER_COUNTS = new Set(['2', '3', '4'])
const SUPPORTED_DIRECTIONS = new Set(['clockwise', 'counter-clockwise'])
const SUPPORTED_SEATS = new Set(['bottom', 'top', 'left', 'right'])

const getPlayerCount = (value) => {
  if (SUPPORTED_PLAYER_COUNTS.has(value)) return Number(value)
  return 4
}

const getDirection = (value) => {
  if (SUPPORTED_DIRECTIONS.has(value)) return value
  return undefined
}

const getNonNegativeInteger = (value) => {
  if (value == null) return undefined
  const parsedValue = Number(value)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) return undefined
  return parsedValue
}

const getSeat = (value) => {
  if (SUPPORTED_SEATS.has(value)) return value
  return 'bottom'
}

/**
 * Builds the full GameTable prop set from mock data shaped by the page's
 * query params (?players=, ?direction=, ?handSize=, ?pendingDraw=,
 * ?current-player=).
 */
export const getMockGameFromSearchParams = (searchParams) => {
  const game = getMockGameState({
    direction: getDirection(searchParams.get('direction')),
    handSize: getNonNegativeInteger(searchParams.get('handSize')),
    pendingDraw: getNonNegativeInteger(searchParams.get('pendingDraw')),
    playerCount: getPlayerCount(searchParams.get('players')),
  })
  const currentSeat = getSeat(searchParams.get('current-player'))
  const currentPlayer =
    game.players.find((player) => player.seat === currentSeat) ??
    game.players[0]

  return {
    currentPlayer,
    currentTurnPlayerId: game.currentTurnPlayerId,
    deckSize: game.deckSize,
    direction: game.direction,
    opponents: game.players.filter((player) => player.id !== currentPlayer.id),
    pendingDraw: game.pendingDraw,
    topCard: game.topCard,
  }
}
