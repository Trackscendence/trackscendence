const prisma = require('#db/prisma')

const publicProfileSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  createdAt: true,
  gamesPlayed: true,
  wins: true,
  losses: true,
  rank: true,
}

const publicIdentitySelect = {
  id: true,
  username: true,
  displayName: true,
}

const selfProfileSelect = {
  ...publicProfileSelect,
  email: true,
  role: true,
  twoFactorEnabled: true,
  twoFactorPendingSecretCiphertext: true,
}

const matchHistorySelect = {
  gameId: true,
  score: true,
  isWinner: true,
  game: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      players: {
        select: {
          userId: true,
          score: true,
          isWinner: true,
          user: {
            select: publicIdentitySelect,
          },
        },
      },
    },
  },
}

const findPublicProfileByUsername = (username) => {
  return prisma.user.findUnique({
    where: { username },
    select: publicProfileSelect,
  })
}

const updateProfileById = (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: selfProfileSelect,
  })
}

const listRecentMatchesForUser = (userId, limit) => {
  return prisma.gamePlayer.findMany({
    where: { userId },
    orderBy: [
      { game: { endedAt: 'desc' } },
      { game: { startedAt: 'desc' } },
      { id: 'desc' },
    ],
    take: limit,
    select: matchHistorySelect,
  })
}

module.exports = {
  findPublicProfileByUsername,
  listRecentMatchesForUser,
  updateProfileById,
}
