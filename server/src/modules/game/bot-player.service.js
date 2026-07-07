const botPlayerRepository = require('#modules/game/bot-player.repository')
const { COLORS } = require('#modules/game/game.constants')

const STANDARD_COLORS = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE]

const BOT_PLAYERS = [
  {
    email: 'bot-uno@trackscendence.local',
    username: 'bot-uno',
    displayName: 'Uno',
  },
  {
    email: 'bot-skip@trackscendence.local',
    username: 'bot-skip',
    displayName: 'Skip',
  },
  {
    email: 'bot-reverse@trackscendence.local',
    username: 'bot-reverse',
    displayName: 'Reverse',
  },
  {
    email: 'bot-wild@trackscendence.local',
    username: 'bot-wild',
    displayName: 'Wild',
  },
  {
    email: 'bot-draw@trackscendence.local',
    username: 'bot-draw',
    displayName: 'Draw',
  },
]

const botUserIds = new Set()

const rememberBotUsers = (users) => {
  users.forEach((user) => {
    if (user?.id != null) botUserIds.add(Number(user.id))
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

const isBotUserId = (userId) => botUserIds.has(Number(userId))

const pickDeclaredColor = (hand) => {
  const counts = new Map(STANDARD_COLORS.map((color) => [color, 0]))
  hand.forEach((card) => {
    if (!counts.has(card.color)) return
    counts.set(card.color, counts.get(card.color) + 1)
  })

  return STANDARD_COLORS.reduce((bestColor, color) =>
    counts.get(color) > counts.get(bestColor) ? color : bestColor,
  )
}

const declaredColorFor = (card, hand) =>
  card.color === COLORS.WILD ? pickDeclaredColor(hand) : null

const playNextAction = (engine) => {
  const { currentPlayer } = engine.getState()
  const hand = engine.getHand(currentPlayer)

  if (engine.hasDrawnThisTurn) {
    const drawnIndex = hand.length - 1
    const drawnCard = hand[drawnIndex]
    if (engine.canPlayCard(drawnCard)) {
      engine.playCard(
        currentPlayer,
        drawnIndex,
        declaredColorFor(drawnCard, hand),
      )
      return
    }
    engine.pass(currentPlayer)
    return
  }

  const playableIndex = hand.findIndex((card) => engine.canPlayCard(card))
  if (playableIndex !== -1) {
    const cardToPlay = hand[playableIndex]
    engine.playCard(
      currentPlayer,
      playableIndex,
      declaredColorFor(cardToPlay, hand),
    )
    return
  }

  const result = engine.drawCard(currentPlayer)
  if (!result.playable) return

  const nextHand = engine.getHand(currentPlayer)
  const drawnIndex = nextHand.length - 1
  const drawnCard = nextHand[drawnIndex]
  engine.playCard(
    currentPlayer,
    drawnIndex,
    declaredColorFor(drawnCard, nextHand),
  )
}

module.exports = {
  ensureBotPlayers,
  getBotPoolSize,
  isBotUserId,
  pickDeclaredColor,
  playNextAction,
  rememberBotUsers,
}
