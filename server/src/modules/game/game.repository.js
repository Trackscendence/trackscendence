const prisma = require('#db/prisma')

/**
 * Saves a completed game and its players' results to the database.
 *
 * @param {Object} gameData
 * @param {Date} gameData.startedAt
 * @param {Date} gameData.endedAt
 * @param {string} gameData.status - e.g., 'COMPLETED' or 'ABANDONED'
 * @param {Array} gameData.players - Array of { userId: Int, score: Int, isWinner: Boolean }
 * @returns {Promise<Object>} The created Game object
 */
const saveGameResult = async ({ startedAt, endedAt, status, players }) => {
  // Use a transaction to ensure both the Game and GamePlayers are created together
  return await prisma.$transaction(async (tx) => {
    const game = await tx.game.create({
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
  })
}

/**
 * Fetches leaderboard stats, aggregating wins for each user.
 *
 * @param {number} limit - Number of leaderboard entries to return
 * @returns {Promise<Array>} Array of { userId, username, totalWins, totalScore }
 */
const getLeaderboard = async (limit = 10) => {
  // In Prisma, doing a full aggregation with user joins is best done via groupBy and manual mapping,
  // or via a raw query if it gets too complex. We will use Prisma's aggregate features.

  const leaderboard = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      _count: {
        select: {
          games: {
            where: { isWinner: true },
          },
        },
      },
      games: {
        select: { score: true },
      },
    },
    take: limit,
    // Note: Prisma does not easily support ordering by nested relation aggregates without a complex query
    // so for a robust leaderboard we fetch all users (or relevant users) and sort in memory,
    // or use a raw SQL query. Given the educational nature, we use a raw query for efficiency.
  })

  // Sort in memory for simple implementation (or use raw query below for production)
  const mapped = leaderboard.map((user) => {
    const totalWins = user._count.games
    const totalScore = user.games.reduce((sum, g) => sum + g.score, 0)
    return {
      userId: user.id,
      username: user.username,
      totalWins,
      totalScore,
    }
  })

  // Sort by wins descending, then by score descending
  mapped.sort((a, b) => {
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins
    }
    return b.totalScore - a.totalScore
  })

  return mapped
}

module.exports = {
  saveGameResult,
  getLeaderboard,
}
