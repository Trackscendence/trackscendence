const prisma = require('#db/prisma')
const {
  pickDeclaredColor,
  playNextAction,
} = require('#modules/game/bot-player.service')

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

module.exports = {
  ensureDevPlayer,
  getFillPlayerNames,
  normalizePlayerName,
  pickDeclaredColor,
  playNextAction,
  resolveSpeedMs,
}
