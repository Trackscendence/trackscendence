const { Prisma } = require('@prisma/client')
const prisma = require('#db/prisma')
const {
  refreshUserRanks,
  updateLifetimeStatsForUsers,
} = require('./game.stats')

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

// Sort keys map to output-column aliases of the leaderboard query so ORDER BY
// can reference the aggregates. Only these whitelisted fragments ever reach
// Prisma.raw — user input never does.
const LEADERBOARD_SORT_COLUMNS = {
  wins: '"totalWins"',
  totalScore: '"totalScore"',
  gamesPlayed: '"gamesPlayed"',
  winRate: '"winRate"',
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

// Escapes LIKE pattern metacharacters so a search for "50%" matches the
// literal text instead of acting as a wildcard.
const escapeLikePattern = (value) => value.replace(/[\\%_]/g, '\\$&')

const buildLeaderboardWhere = (search) => {
  if (!search) {
    return Prisma.empty
  }

  const pattern = `%${escapeLikePattern(search)}%`

  return Prisma.sql`WHERE (u.username ILIKE ${pattern} OR u."displayName" ILIKE ${pattern})`
}

const buildLeaderboardHaving = (minGames) => {
  if (!minGames || minGames < 1) {
    return Prisma.empty
  }

  return Prisma.sql`HAVING COUNT(gp.id) >= ${minGames}`
}

/**
 * Fetches leaderboard stats, aggregating wins for each user.
 *
 * @param {Object} options
 * @param {number} [options.limit] - Number of leaderboard entries to return
 * @param {number} [options.offset] - Number of leading entries to skip (for pagination)
 * @param {string} [options.search] - Case-insensitive substring match on username or display name
 * @param {number} [options.minGames] - Only include players with at least this many recorded games
 * @param {'wins' | 'totalScore' | 'gamesPlayed' | 'winRate'} [options.sort] - Aggregate to sort by
 * @param {'asc' | 'desc'} [options.order] - Sort direction
 * @returns {Promise<Array<{ userId: number, username: string, displayName: string | null, totalWins: number, totalScore: number, gamesPlayed: number, winRate: number }>>}
 */
const getLeaderboard = async ({
  limit = 10,
  offset = 0,
  search = '',
  minGames = 0,
  sort = 'wins',
  order = 'desc',
} = {}) => {
  const sortColumn =
    LEADERBOARD_SORT_COLUMNS[sort] || LEADERBOARD_SORT_COLUMNS.wins
  const direction = order === 'asc' ? 'ASC' : 'DESC'

  // Use Prisma's native $queryRaw for high-performance database-level aggregation and sorting.
  // This pushes the heavy lifting of counting, summing, and sorting entirely to Postgres.
  const leaderboard = await prisma.$queryRaw`
    SELECT
      u.id AS "userId",
      u.username,
      u."displayName",
      CAST(COUNT(CASE WHEN gp."isWinner" = true THEN 1 END) AS INTEGER) AS "totalWins",
      CAST(COALESCE(SUM(gp.score), 0) AS INTEGER) AS "totalScore",
      CAST(COUNT(gp.id) AS INTEGER) AS "gamesPlayed",
      CAST(COUNT(CASE WHEN gp."isWinner" = true THEN 1 END) AS DOUBLE PRECISION) / COUNT(gp.id) AS "winRate"
    FROM "User" u
    JOIN "GamePlayer" gp ON u.id = gp."userId"
    ${buildLeaderboardWhere(search)}
    GROUP BY u.id, u.username, u."displayName"
    ${buildLeaderboardHaving(minGames)}
    ORDER BY ${Prisma.raw(sortColumn)} ${Prisma.raw(direction)}, "totalWins" DESC, "totalScore" DESC, u.id ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `

  return leaderboard
}

/**
 * Counts how many users match the current leaderboard filters (players with
 * at least one recorded game), so paginated consumers can compute the number
 * of pages.
 *
 * @param {Object} options
 * @param {string} [options.search] - Same filter as getLeaderboard
 * @param {number} [options.minGames] - Same filter as getLeaderboard
 * @returns {Promise<number>}
 */
const countLeaderboardPlayers = async ({ search = '', minGames = 0 } = {}) => {
  const rows = await prisma.$queryRaw`
    SELECT CAST(COUNT(*) AS INTEGER) AS "totalCount"
    FROM (
      SELECT u.id
      FROM "User" u
      JOIN "GamePlayer" gp ON u.id = gp."userId"
      ${buildLeaderboardWhere(search)}
      GROUP BY u.id
      ${buildLeaderboardHaving(minGames)}
    ) AS players
  `

  return rows[0]?.totalCount || 0
}

module.exports = {
  saveGameResult,
  getLeaderboard,
  countLeaderboardPlayers,
}
