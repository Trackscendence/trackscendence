// Maps the server's game_state_update payload (engine public state + myHand)
// onto the props GameTable was designed around. Pure: no store reads, no side
// effects, so the translation stays testable and the socket shape changes in
// exactly one place.

// Engine colors are uppercase ('RED'); the Card component's palette keys are
// lowercase ('red').
const toCardColor = (serverColor) =>
  typeof serverColor === 'string' ? serverColor.toLowerCase() : 'wild'

// Engine values '0'-'9' render as number cards; action values map onto the
// Card symbol types. WILD_DRAW_FOUR reuses the wild_draw3 art until the +4
// Figma export lands (#196) — the engine already deals a real Draw Four.
const ACTION_TYPES = {
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw2',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw3',
}

const toCard = (serverCard, index) => {
  const isNumber = /^\d$/.test(serverCard.value)
  return {
    id: `${index}-${serverCard.color}-${serverCard.value}`,
    color: toCardColor(serverCard.color),
    type: isNumber ? 'number' : ACTION_TYPES[serverCard.value],
    ...(isNumber ? { value: Number(serverCard.value) } : {}),
  }
}

// Mirrors the engine's canPlayCard so the hand can show what is legal without
// a server round trip: wilds always play, otherwise match the declared color
// or the top card's value.
const isCardPlayable = (serverCard, state) =>
  serverCard.color === 'WILD' ||
  serverCard.color === state.currentColor ||
  serverCard.value === state.topCard.value

// Seat layout mirrors the mock's arrangement per opponent count.
const OPPONENT_SEATS = {
  1: ['top'],
  2: ['left', 'right'],
  3: ['top', 'left', 'right'],
}

/**
 * @param {Object} state game_state_update payload
 * @param {Array<{userId: number, username: string}>} matchPlayers from game_start
 * @param {number} ownUserId
 * @param {string} ownUsername
 * @returns {Object} GameTable props
 */
const mapServerGameState = ({
  state,
  matchPlayers,
  ownUserId,
  ownUsername,
}) => {
  const usernamesById = new Map(
    (matchPlayers ?? []).map((player) => [player.userId, player.username]),
  )

  const opponentIds = Object.keys(state.playerHandsSizes ?? {})
    .map(Number)
    .filter((userId) => userId !== ownUserId)
  const seats = OPPONENT_SEATS[opponentIds.length] ?? OPPONENT_SEATS[3]
  const opponents = opponentIds.map((userId, index) => ({
    id: userId,
    username: usernamesById.get(userId) ?? `Player ${index + 2}`,
    seat: seats[index] ?? 'top',
    cardCount: state.playerHandsSizes[userId],
  }))

  const topCard = toCard(state.topCard, 'top')
  return {
    currentPlayer: {
      id: ownUserId,
      username: ownUsername,
      seat: 'bottom',
      cards: (state.myHand ?? []).map((card, index) => ({
        ...toCard(card, index),
        playable: isCardPlayable(card, state),
      })),
    },
    opponents,
    currentTurnPlayerId: state.currentPlayer,
    deckSize: state.deckSize,
    direction: state.playDirection === -1 ? 'counter-clockwise' : 'clockwise',
    // Draw penalties are applied by the engine the moment the card is played,
    // so there is never an outstanding "+N" to display from live state.
    pendingDraw: 0,
    topCard: {
      ...topCard,
      // A wild on top of the discard owes the table its declared color;
      // tinting the card face is how the current color stays visible.
      color:
        topCard.color === 'wild' && state.currentColor
          ? toCardColor(state.currentColor)
          : topCard.color,
    },
  }
}

export default mapServerGameState
