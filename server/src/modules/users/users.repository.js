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

const getStatsForUser = async (userId) => {
  const rows = await prisma.$queryRaw`
    SELECT
      CAST(COUNT(gp.id) AS INTEGER) AS "gamesPlayed",
      CAST(COUNT(CASE WHEN gp."isWinner" = true THEN 1 END) AS INTEGER) AS "wins",
      CAST(COUNT(CASE WHEN gp."isWinner" = false THEN 1 END) AS INTEGER) AS "losses"
    FROM "GamePlayer" gp
    JOIN "Game" g ON g.id = gp."gameId"
    WHERE gp."userId" = ${userId}
      AND g.status = 'COMPLETED'
  `

  return rows[0] || { gamesPlayed: 0, wins: 0, losses: 0 }
}

const getRankForUser = async (userId) => {
  const rows = await prisma.$queryRaw`
    WITH stats AS (
      SELECT
        gp."userId",
        COUNT(gp.id) AS "gamesPlayed",
        COUNT(CASE WHEN gp."isWinner" = true THEN 1 END) AS "wins",
        COALESCE(SUM(gp.score), 0) AS "totalScore"
      FROM "GamePlayer" gp
      JOIN "Game" g ON g.id = gp."gameId"
      WHERE g.status = 'COMPLETED'
      GROUP BY gp."userId"
    ),
    ranked AS (
      SELECT
        "userId",
        DENSE_RANK() OVER (
          ORDER BY "wins" DESC, "totalScore" DESC, "gamesPlayed" ASC, "userId" ASC
        ) AS "rank"
      FROM stats
    )
    SELECT CAST("rank" AS INTEGER) AS "rank"
    FROM ranked
    WHERE "userId" = ${userId}
  `

  return rows[0]?.rank || null
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
  getRankForUser,
  getStatsForUser,
  listPublicFriendsForUser,
  listRecentMatchesForUser,
  updateProfileById,
}
