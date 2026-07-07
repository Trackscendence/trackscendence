const botPlayerRepository = require('#modules/game/bot-player.repository')
const { CARD_TYPES, COLORS, VALUES } = require('#modules/game/game.constants')

const STANDARD_COLORS = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE]

const BOT_STRATEGIES = {
  BALANCED: 'balanced',
  TEMPO: 'tempo',
  LEADER: 'leader',
  CLOSER: 'closer',
  PRESSURE: 'pressure',
}

const BOT_PLAYERS = [
  {
    email: 'bot-uno@trackscendence.local',
    username: 'bot-uno',
    displayName: 'Uno',
    bio: 'Balanced house player who keeps color options open and avoids risky hands.',
    avatarUrl: '/bot-avatars/uno.svg',
    strategy: BOT_STRATEGIES.BALANCED,
  },
  {
    email: 'bot-skip@trackscendence.local',
    username: 'bot-skip',
    displayName: 'Skip',
    bio: 'Tempo house player who spends action cards early to keep the table moving.',
    avatarUrl: '/bot-avatars/skip.svg',
    strategy: BOT_STRATEGIES.TEMPO,
  },
  {
    email: 'bot-reverse@trackscendence.local',
    username: 'bot-reverse',
    displayName: 'Reverse',
    bio: 'Table reader who steers colors away from the player with the shortest hand.',
    avatarUrl: '/bot-avatars/reverse.svg',
    strategy: BOT_STRATEGIES.LEADER,
  },
  {
    email: 'bot-wild@trackscendence.local',
    username: 'bot-wild',
    displayName: 'Wild',
    bio: 'Patient finisher who saves wild cards until the last few turns.',
    avatarUrl: '/bot-avatars/wild.svg',
    strategy: BOT_STRATEGIES.CLOSER,
  },
  {
    email: 'bot-draw@trackscendence.local',
    username: 'bot-draw',
    displayName: 'Draw',
    bio: 'Pressure house player who looks for draw cards before safe number plays.',
    avatarUrl: '/bot-avatars/draw.svg',
    strategy: BOT_STRATEGIES.PRESSURE,
  },
]

const ACTION_VALUES = new Set([VALUES.SKIP, VALUES.REVERSE, VALUES.DRAW_TWO])
const botPlayerByUsername = new Map(
  BOT_PLAYERS.map((player) => [player.username, player]),
)
const botUserIds = new Set()
const botStrategiesByUserId = new Map()

const normalizeUserId = (userId) => {
  const normalized = Number(userId)
  return Number.isFinite(normalized) ? normalized : null
}

const rememberBotUsers = (users) => {
  users.forEach((user) => {
    const userId = normalizeUserId(user?.id)
    if (userId == null) return

    botUserIds.add(userId)

    const player = botPlayerByUsername.get(user.username)
    if (player) {
      botStrategiesByUserId.set(userId, player.strategy)
    }
  })
}

const getBotPoolSize = () => BOT_PLAYERS.length

const ensureBotPlayers = async (count = BOT_PLAYERS.length) => {
  const players = []
  const cappedCount = Math.min(
    Math.max(Number(count) || 0, 0),
    BOT_PLAYERS.length,
  )

  for (const player of BOT_PLAYERS.slice(0, cappedCount)) {
    const user = await botPlayerRepository.upsertBotPlayer(player)
    players.push(user)
  }

  rememberBotUsers(players)
  return players
}

const isBotUserId = (userId) => {
  const normalized = normalizeUserId(userId)
  return normalized == null ? false : botUserIds.has(normalized)
}

const getBotStrategyForUserId = (userId) => {
  const normalized = normalizeUserId(userId)
  if (normalized == null) return BOT_STRATEGIES.BALANCED
  return botStrategiesByUserId.get(normalized) ?? BOT_STRATEGIES.BALANCED
}

const isWildCard = (card) =>
  card?.type === CARD_TYPES.WILD || card?.color === COLORS.WILD

const isActionCard = (card) =>
  card?.type === CARD_TYPES.ACTION || ACTION_VALUES.has(card?.value)

const cardPointValue = (card) => {
  if (isWildCard(card)) return 50
  if (isActionCard(card)) return 20
  const value = Number(card?.value)
  return Number.isFinite(value) ? value : 0
}

const colorCountsFor = (hand) => {
  const counts = new Map(STANDARD_COLORS.map((color) => [color, 0]))
  hand.forEach((card) => {
    if (!counts.has(card.color)) return
    counts.set(card.color, counts.get(card.color) + 1)
  })
  return counts
}

const pickDeclaredColor = (hand) => {
  const counts = colorCountsFor(hand)

  return STANDARD_COLORS.reduce((bestColor, color) =>
    counts.get(color) > counts.get(bestColor) ? color : bestColor,
  )
}

const pickLeastCommonColor = (hand) => {
  const counts = colorCountsFor(hand)

  return STANDARD_COLORS.reduce((bestColor, color) =>
    counts.get(color) < counts.get(bestColor) ? color : bestColor,
  )
}

const getLeaderPlayerId = (engine, currentPlayer) => {
  const state = engine.getState()
  const handSizes = state.playerHandsSizes || {}
  const currentPlayerKey = String(currentPlayer)
  const candidates = Object.entries(handSizes)
    .filter(([playerId]) => playerId !== currentPlayerKey)
    .sort(
      ([leftId, leftSize], [rightId, rightSize]) =>
        leftSize - rightSize || leftId.localeCompare(rightId),
    )

  return candidates[0]?.[0] ?? null
}

const getLeaderHand = (engine, currentPlayer) => {
  const leaderId = getLeaderPlayerId(engine, currentPlayer)
  return leaderId == null ? [] : engine.getHand(leaderId)
}

const declaredColorFor = (card, hand, { engine, currentPlayer, strategy }) => {
  if (!isWildCard(card)) return null

  if (strategy === BOT_STRATEGIES.LEADER && engine) {
    const leaderHand = getLeaderHand(engine, currentPlayer)
    if (leaderHand.length > 0) {
      return pickLeastCommonColor(leaderHand)
    }
  }

  return pickDeclaredColor(hand)
}

const getPlayableCards = (engine, hand) =>
  hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => engine.canPlayCard(card))

const highestPointCard = (cards) =>
  [...cards].sort(
    (left, right) =>
      cardPointValue(right.card) - cardPointValue(left.card) ||
      left.index - right.index,
  )[0]

const firstMatchingCard = (cards, predicate) =>
  cards.find(({ card }) => predicate(card)) ?? null

const selectTempoCard = (playableCards) =>
  firstMatchingCard(
    playableCards,
    (card) => isActionCard(card) && !isWildCard(card),
  ) ??
  firstMatchingCard(playableCards, (card) => !isWildCard(card)) ??
  playableCards[0]

const selectCloserCard = (playableCards, hand) => {
  const nonWild = firstMatchingCard(playableCards, (card) => !isWildCard(card))
  if (hand.length > 2 && nonWild) return nonWild
  return highestPointCard(playableCards)
}

const selectPressureCard = (playableCards) =>
  firstMatchingCard(playableCards, (card) =>
    [VALUES.WILD_DRAW_FOUR, VALUES.WILD_DRAW_THREE, VALUES.DRAW_TWO].includes(
      card.value,
    ),
  ) ??
  firstMatchingCard(playableCards, (card) => ACTION_VALUES.has(card.value)) ??
  highestPointCard(playableCards)

const selectLeaderCard = ({ engine, currentPlayer, playableCards }) => {
  const leaderHand = getLeaderHand(engine, currentPlayer)
  if (leaderHand.length === 0) return playableCards[0]

  const leaderColorCounts = colorCountsFor(leaderHand)
  return [...playableCards].sort((left, right) => {
    const leftColor = isWildCard(left.card)
      ? pickLeastCommonColor(leaderHand)
      : left.card.color
    const rightColor = isWildCard(right.card)
      ? pickLeastCommonColor(leaderHand)
      : right.card.color

    return (
      leaderColorCounts.get(leftColor) - leaderColorCounts.get(rightColor) ||
      cardPointValue(right.card) - cardPointValue(left.card) ||
      left.index - right.index
    )
  })[0]
}

const selectCardForStrategy = ({
  strategy,
  engine,
  currentPlayer,
  hand,
  playableCards,
}) => {
  if (strategy === BOT_STRATEGIES.TEMPO) {
    return selectTempoCard(playableCards)
  }
  if (strategy === BOT_STRATEGIES.LEADER) {
    return selectLeaderCard({ engine, currentPlayer, playableCards })
  }
  if (strategy === BOT_STRATEGIES.CLOSER) {
    return selectCloserCard(playableCards, hand)
  }
  if (strategy === BOT_STRATEGIES.PRESSURE) {
    return selectPressureCard(playableCards)
  }
  return playableCards[0]
}

const shouldPassPlayableDrawnCard = (strategy, card, hand) =>
  strategy === BOT_STRATEGIES.CLOSER && isWildCard(card) && hand.length > 2

const playSelectedCard = ({
  engine,
  currentPlayer,
  hand,
  selected,
  strategy,
}) => {
  engine.playCard(
    currentPlayer,
    selected.index,
    declaredColorFor(selected.card, hand, {
      engine,
      currentPlayer,
      strategy,
    }),
  )
}

const playNextAction = (engine) => {
  const { currentPlayer } = engine.getState()
  const strategy = getBotStrategyForUserId(currentPlayer)
  const hand = engine.getHand(currentPlayer)

  if (engine.hasDrawnThisTurn) {
    const drawnIndex = hand.length - 1
    const drawnCard = hand[drawnIndex]
    if (engine.canPlayCard(drawnCard)) {
      if (shouldPassPlayableDrawnCard(strategy, drawnCard, hand)) {
        engine.pass(currentPlayer)
        return
      }
      playSelectedCard({
        engine,
        currentPlayer,
        hand,
        selected: { card: drawnCard, index: drawnIndex },
        strategy,
      })
      return
    }
    engine.pass(currentPlayer)
    return
  }

  const playableCards = getPlayableCards(engine, hand)
  if (playableCards.length > 0) {
    const selected = selectCardForStrategy({
      strategy,
      engine,
      currentPlayer,
      hand,
      playableCards,
    })
    playSelectedCard({ engine, currentPlayer, hand, selected, strategy })
    return
  }

  const result = engine.drawCard(currentPlayer)
  if (!result.playable) return

  const nextHand = engine.getHand(currentPlayer)
  const drawnIndex = nextHand.length - 1
  const drawnCard = nextHand[drawnIndex]
  if (shouldPassPlayableDrawnCard(strategy, drawnCard, nextHand)) {
    engine.pass(currentPlayer)
    return
  }

  playSelectedCard({
    engine,
    currentPlayer,
    hand: nextHand,
    selected: { card: drawnCard, index: drawnIndex },
    strategy,
  })
}

module.exports = {
  BOT_STRATEGIES,
  ensureBotPlayers,
  getBotPoolSize,
  getBotStrategyForUserId,
  isBotUserId,
  pickDeclaredColor,
  playNextAction,
  rememberBotUsers,
}
