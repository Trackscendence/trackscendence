const prisma = require('#db/prisma')
const { COLORS } = require('#modules/game/game.constants')

const DEV_PLAYERS = {
  uno: {
    email: 'dev-room-uno@trackscendence.local',
    username: 'dev-uno',
    displayName: 'uno',
  },
  skip: {
    email: 'dev-room-skip@trackscendence.local',
    username: 'dev-skip',
    displayName: 'skip',
  },
  bot: {
    email: 'dev-room-bot@trackscendence.local',
    username: 'dev-bot',
    displayName: 'bot',
  },
}
const DEV_PLAYER_NAMES = Object.keys(DEV_PLAYERS)

const SPEED_MS = {
  slow: 1600,
  normal: 900,
  fast: 350,
}

const normalizePlayerName = (name) =>
  Object.hasOwn(DEV_PLAYERS, name) ? name : 'bot'

const resolveSpeedMs = (speed) => SPEED_MS[speed] ?? SPEED_MS.normal

const getFillPlayerNames = (firstName, count) => {
  const normalizedName = normalizePlayerName(firstName)
  return [
    normalizedName,
    ...DEV_PLAYER_NAMES.filter((name) => name !== normalizedName),
  ].slice(0, count)
}

const ensureDevPlayer = async (name) => {
  const player = DEV_PLAYERS[normalizePlayerName(name)]
  return prisma.user.upsert({
    where: { email: player.email },
    update: {
      username: player.username,
      displayName: player.displayName,
    },
    create: {
      email: player.email,
      username: player.username,
      displayName: player.displayName,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  })
}

const pickDeclaredColor = (hand) => {
  const counts = {}
  hand.forEach((card) => {
    if (card.color === COLORS.WILD) return
    counts[card.color] = (counts[card.color] ?? 0) + 1
  })
  const ranked = Object.entries(counts).sort(
    (left, right) => right[1] - left[1],
  )
  return ranked[0]?.[0] ?? COLORS.RED
}

const playNextAction = (engine) => {
  const { currentPlayer } = engine.getState()
  const hand = engine.getHand(currentPlayer)

  if (engine.hasDrawnThisTurn) {
    const drawnIndex = hand.length - 1
    const drawnCard = hand[drawnIndex]
    engine.playCard(
      currentPlayer,
      drawnIndex,
      drawnCard.color === COLORS.WILD ? pickDeclaredColor(hand) : null,
    )
    return
  }

  const playableIndex = hand.findIndex((card) => engine.canPlayCard(card))
  if (playableIndex === -1) {
    const result = engine.drawCard(currentPlayer)
    if (result.playable) {
      const nextHand = engine.getHand(currentPlayer)
      const drawnCard = nextHand[nextHand.length - 1]
      engine.playCard(
        currentPlayer,
        nextHand.length - 1,
        drawnCard.color === COLORS.WILD ? pickDeclaredColor(nextHand) : null,
      )
    }
    return
  }

  const cardToPlay = hand[playableIndex]
  engine.playCard(
    currentPlayer,
    playableIndex,
    cardToPlay.color === COLORS.WILD ? pickDeclaredColor(hand) : null,
  )
}

module.exports = {
  ensureDevPlayer,
  getFillPlayerNames,
  normalizePlayerName,
  pickDeclaredColor,
  playNextAction,
  resolveSpeedMs,
}
