const prisma = require('#db/prisma')

const publicIdentitySelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

const publicProfileSelect = {
  ...publicIdentitySelect,
  bio: true,
  createdAt: true,
  gamesPlayed: true,
  wins: true,
  losses: true,
  rank: true,
  isGuest: true,
}
const selfProfileSelect = {
  ...publicProfileSelect,
  email: true,
  role: true,
  termsAcceptedAt: true,
  privacyAcceptedAt: true,
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
  return prisma.user.findFirst({
    where: { username, deletedAt: null },
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

const updateAvatarById = (id, avatarUrl) => {
  return prisma.user.update({
    where: { id },
    data: { avatarUrl },
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

// Escapes LIKE pattern metacharacters: Prisma's `contains` maps to ILIKE on
// Postgres without escaping, so a search for "50%" would otherwise act as a
// wildcard instead of matching the literal text.
const escapeLikePattern = (value) => value.replace(/[\\%_]/g, '\\$&')

const searchUsersByName = async ({ query, limit, offset }) => {
  const escapedQuery = escapeLikePattern(query)
  const where = {
    deletedAt: null,
    OR: [
      { username: { contains: escapedQuery, mode: 'insensitive' } },
      { displayName: { contains: escapedQuery, mode: 'insensitive' } },
    ],
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ username: 'asc' }],
      skip: offset,
      take: limit,
      select: publicIdentitySelect,
    }),
    prisma.user.count({ where }),
  ])

  return { users, totalCount }
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
  searchUsersByName,
  updateAvatarById,
  updateProfileById,
}
