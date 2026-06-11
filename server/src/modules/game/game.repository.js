const prisma = require('#db/prisma')

/**
 * Saves a completed game and its players' results to the database.
 *
 * @param {Object} gameData
 * @param {Date} gameData.startedAt
 * @param {Date} gameData.endedAt
 * @param {'COMPLETED' | 'ABANDONED'} gameData.status
 * @param {Array<{ userId: number, score: number, isWinner: boolean }>} gameData.players
 * @returns {Promise<Object>} The created Game object
 */
const saveGameResult = async ({ startedAt, endedAt, status, players }) => {
  if (!players || players.length < 2) {
    throw new Error('A game must have at least 2 players to be saved.')
  }
  if (!endedAt) {
    throw new Error('A completed or abandoned game must have an endedAt timestamp.')
  }

  // Use a nested write to ensure both the Game and GamePlayers are created transactionally
  // and efficiently in a single database round-trip.
  const game = await prisma.game.create({
    data: {
      startedAt,
      endedAt,
      status,
      players: {
        create: players.map((p) => ({
          userId: p.userId,
          score: p.score,
          isWinner: p.isWinner,
        })),
      },
    },
    include: {
      players: true,
    },
  })
  
  return game
}

/**
 * Fetches leaderboard stats, aggregating wins for each user.
 *
 * @param {number} limit - Number of leaderboard entries to return
 * @returns {Promise<Array<{ userId: number, username: string, totalWins: number, totalScore: number }>>}
 */
const getLeaderboard = async (limit = 10) => {
  // Use Prisma's native $queryRaw for high-performance database-level aggregation and sorting.
  // This pushes the heavy lifting of counting, summing, and sorting entirely to Postgres.
  const leaderboard = await prisma.$queryRaw`
    SELECT
      u.id AS "userId",
      u.username,
      CAST(COUNT(CASE WHEN gp."isWinner" = true THEN 1 END) AS INTEGER) AS "totalWins",
      CAST(COALESCE(SUM(gp.score), 0) AS INTEGER) AS "totalScore"
    FROM "User" u
    JOIN "GamePlayer" gp ON u.id = gp."userId"
    GROUP BY u.id, u.username
    ORDER BY "totalWins" DESC, "totalScore" DESC
    LIMIT ${limit}
  `

  return leaderboard
}

module.exports = {
  saveGameResult,
  getLeaderboard,
}
