const prisma = require('#db/prisma')

const publicIdentitySelect = {
  id: true,
  username: true,
  displayName: true,
}

const publicProfileSelect = {
  ...publicIdentitySelect,
  bio: true,
  createdAt: true,
  gamesPlayed: true,
  wins: true,
  losses: true,
  rank: true,
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

const relationshipSelect = {
  requesterId: true,
  addresseeId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

const findSelfProfileById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: selfProfileSelect,
  })
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

const findRelationshipBetweenUsers = (firstUserId, secondUserId) => {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        {
          requesterId: firstUserId,
          addresseeId: secondUserId,
        },
        {
          requesterId: secondUserId,
          addresseeId: firstUserId,
        },
      ],
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    select: relationshipSelect,
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

const listPublicFriendsForUser = (userId, limit = 6) => {
  return prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: {
      requesterId: true,
      addresseeId: true,
      updatedAt: true,
      requester: {
        select: publicIdentitySelect,
      },
      addressee: {
        select: publicIdentitySelect,
      },
    },
  })
}

module.exports = {
  findPublicProfileByUsername,
  findRelationshipBetweenUsers,
  findSelfProfileById,
  listPublicFriendsForUser,
  listRecentMatchesForUser,
  updateProfileById,
}
