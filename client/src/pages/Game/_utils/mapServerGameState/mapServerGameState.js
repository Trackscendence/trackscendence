import getPlayerIdentity from '@/utils/getPlayerIdentity'

// Maps the server's game_state_update payload (engine public state + myHand)
// onto the props GameTable was designed around. Pure: no store reads, no side
// effects, so the translation stays testable and the socket shape changes in
// exactly one place. Player names and avatars go through getPlayerIdentity so
// the table shows the same identity as the lobby and waiting room.

// Engine colors are uppercase ('RED'); the Card component's palette keys are
// lowercase ('red').
const toCardColor = (serverColor) =>
  typeof serverColor === 'string' ? serverColor.toLowerCase() : 'wild'

// Engine values '0'-'9' render as number cards; action values map onto the
// Card symbol types. The engine deals a real Wild Draw Four (+4 art) and this
// game's custom Wild Draw Three (+3 art) (#143/#196).
const ACTION_TYPES = {
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw2',
  WILD: 'wild',
  WILD_DRAW_THREE: 'wild_draw3',
  WILD_DRAW_FOUR: 'wild_draw4',
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
const matchesTopCard = (serverCard, state) =>
  serverCard.color === 'WILD' ||
  serverCard.color === state.currentColor ||
  serverCard.value === state.topCard.value

// A card is actionable only on the holder's turn, and after a draw the engine
// accepts nothing but the drawn card (it sits at the end of the hand).
const isCardPlayable = (serverCard, index, state, isMyTurn, handSize) =>
  isMyTurn &&
  (!state.hasDrawnThisTurn || index === handSize - 1) &&
  matchesTopCard(serverCard, state)

// Seat layout mirrors the mock's arrangement per opponent count.
const OPPONENT_SEATS = {
  1: ['top'],
  2: ['left', 'right'],
  3: ['top', 'left', 'right'],
}

/**
 * @param {Object} state game_state_update payload
 * @param {Array<{userId: number, username: string, displayName?: string, avatarUrl?: string}>} matchPlayers from game_start
 * @param {number} ownUserId
 * @param {string} ownUsername
 * @param {string} [ownDisplayName] the session user's display name
 * @param {string} [ownAvatarUrl] the session user's avatar
 * @param {boolean} [isSpectator] strips every interaction flag — used by the
 *   Rig's simulation, which plays all seats itself
 * @returns {Object} GameTable props
 */
const mapServerGameState = ({
  state,
  matchPlayers,
  ownUserId,
  ownUsername,
  ownDisplayName,
  ownAvatarUrl,
  isSpectator = false,
}) => {
  const playersById = new Map(
    (matchPlayers ?? []).map((player) => [player.userId, player]),
  )
  const isMyTurn =
    !isSpectator && !state.winner && state.currentPlayer === ownUserId

  const opponentIds = Object.keys(state.playerHandsSizes ?? {})
    .map(Number)
    .filter((userId) => userId !== ownUserId)
  const seats = OPPONENT_SEATS[opponentIds.length] ?? OPPONENT_SEATS[3]
  const opponents = opponentIds.map((userId, index) => {
    const known = playersById.get(userId)
    const identity = getPlayerIdentity(known)
    return {
      id: userId,
      username: known ? identity.name : `Player ${index + 2}`,
      avatarUrl: identity.avatarUrl,
      seat: seats[index] ?? 'top',
      cardCount: state.playerHandsSizes[userId],
    }
  })

  const ownIdentity = getPlayerIdentity({
    username: ownUsername,
    displayName: ownDisplayName,
    avatarUrl: ownAvatarUrl,
  })
  const myHand = state.myHand ?? []
  const topCard = toCard(state.topCard, 'top')
  return {
    currentPlayer: {
      id: ownUserId,
      username: ownIdentity.name,
      avatarUrl: ownIdentity.avatarUrl,
      seat: 'bottom',
      cards: myHand.map((card, index) => ({
        ...toCard(card, index),
        playable: isCardPlayable(card, index, state, isMyTurn, myHand.length),
      })),
    },
    opponents,
    currentTurnPlayerId: state.currentPlayer,
    // Drawing is once per turn; after a playable draw the engine keeps the
    // turn, so passing (or playing the drawn card) is the only way out.
    canDraw: isMyTurn && !state.hasDrawnThisTurn,
    canPass: isMyTurn && Boolean(state.hasDrawnThisTurn),
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
