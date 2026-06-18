const { Prisma } = require('@prisma/client')
const prisma = require('#db/prisma')

const GAME_RESULT_STATUSES = new Set(['COMPLETED', 'ABANDONED'])

const isValidDate = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime())

const validateSavedGameInput = ({ startedAt, endedAt, status, players }) => {
  if (!isValidDate(startedAt)) {
    throw new Error('A saved game must include a valid startedAt timestamp.')
  }

  if (!isValidDate(endedAt)) {
    throw new Error('A saved game must include a valid endedAt timestamp.')
  }

  if (endedAt < startedAt) {
    throw new Error('A saved game cannot end before it starts.')
  }

  if (!GAME_RESULT_STATUSES.has(status)) {
    throw new Error('A saved game must use a supported status.')
  }

  if (!Array.isArray(players) || players.length < 2) {
    throw new Error('A game must have at least 2 players to be saved.')
  }

  const seenUserIds = new Set()
  let winnerCount = 0

  players.forEach((player, index) => {
    if (!Number.isInteger(player?.userId) || player.userId < 1) {
      throw new Error(
        `Player ${index + 1} must include a valid positive integer userId.`,
      )
    }

    if (seenUserIds.has(player.userId)) {
      throw new Error('A saved game cannot contain duplicate players.')
    }
    seenUserIds.add(player.userId)

    if (!Number.isInteger(player?.score) || player.score < 0) {
      throw new Error(
        `Player ${index + 1} must include a valid non-negative integer score.`,
      )
    }

    if (typeof player?.isWinner !== 'boolean') {
      throw new Error(
        `Player ${index + 1} must include a boolean isWinner flag.`,
      )
    }

    if (player.isWinner) {
      winnerCount += 1
    }
  })

  if (status === 'COMPLETED' && winnerCount !== 1) {
    throw new Error('A completed game must have exactly one winner.')
  }

  if (status === 'ABANDONED' && winnerCount !== 0) {
    throw new Error('An abandoned game cannot have a winner.')
  }
}

const updateLifetimeStatsForUsers = async (tx, userIds) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Number.isInteger)

  if (uniqueUserIds.length === 0) {
    return
  }

  await tx.$executeRaw`
    UPDATE "User" u
    SET
      "gamesPlayed" = stats."gamesPlayed",
      "wins" = stats."wins",
      "losses" = stats."losses"
    FROM (
      SELECT
        gp."userId" AS "userId",
        CAST(COUNT(*) AS INTEGER) AS "gamesPlayed",
        CAST(COUNT(*) FILTER (WHERE gp."isWinner" = true) AS INTEGER) AS "wins",
        CAST(
          COUNT(*) FILTER (
            WHERE gp."isWinner" = false AND g."status" = 'COMPLETED'
          ) AS INTEGER
        ) AS "losses"
      FROM "GamePlayer" gp
      JOIN "Game" g ON g."id" = gp."gameId"
      WHERE gp."userId" IN (${Prisma.join(uniqueUserIds)})
      GROUP BY gp."userId"
    ) stats
    WHERE u."id" = stats."userId"
  `
}

const refreshUserRanks = async (tx) => {
  await tx.$executeRaw`
    WITH ranked_users AS (
      SELECT
        u."id",
        CAST(
          ROW_NUMBER() OVER (
            ORDER BY
              u."wins" DESC,
              u."losses" ASC,
              u."gamesPlayed" DESC,
              u."username" ASC
          ) AS INTEGER
        ) AS "computedRank"
      FROM "User" u
      WHERE u."gamesPlayed" > 0
    )
    UPDATE "User" u
    SET "rank" = ranked_users."computedRank"
    FROM ranked_users
    WHERE u."id" = ranked_users."id"
  `
}

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
  validateSavedGameInput({ startedAt, endedAt, status, players })

  const game = await prisma.$transaction(async (tx) => {
    const createdGame = await tx.game.create({
      data: {
        startedAt,
        endedAt,
        status,
        players: {
          create: players.map((player) => ({
            userId: player.userId,
            score: player.score,
            isWinner: player.isWinner,
          })),
        },
      },
      include: {
        players: true,
      },
    })

    await updateLifetimeStatsForUsers(
      tx,
      players.map((player) => player.userId),
    )
    await refreshUserRanks(tx)

    return createdGame
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
