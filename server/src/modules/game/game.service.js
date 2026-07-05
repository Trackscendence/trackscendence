const BadRequestException = require('#exceptions/bad-request.exception')
const gameRepository = require('#modules/game/game.repository')
const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  parsePositiveInteger,
} = require('#utils/query-parsing')

const LEADERBOARD_SORT_FIELDS = ['wins', 'totalScore', 'gamesPlayed', 'winRate']
const LEADERBOARD_SORT_ORDERS = ['asc', 'desc']
const SEARCH_MAX_LENGTH = 50

/**
 * Validates and normalizes the leaderboard query string. Collects every
 * violation into one 400 so the caller sees all bad fields at once.
 */
const parseLeaderboardQuery = (query = {}) => {
  const details = []

  const page = parsePositiveInteger({
    details,
    fieldName: 'page',
    max: MAX_PAGE,
    rawValue: query.page,
    fallback: 1,
  })
  const limit = parsePositiveInteger({
    details,
    fieldName: 'limit',
    max: MAX_PAGE_SIZE,
    rawValue: query.limit,
    fallback: DEFAULT_PAGE_SIZE,
  })

  let search = ''
  if (query.search != null && query.search !== '') {
    if (typeof query.search !== 'string') {
      details.push('search must be a string')
    } else if (query.search.trim().length > SEARCH_MAX_LENGTH) {
      details.push(`search must be at most ${SEARCH_MAX_LENGTH} characters`)
    } else {
      search = query.search.trim()
    }
  }

  let minGames = 0
  if (query.minGames != null && query.minGames !== '') {
    const value = Number(query.minGames)

    if (!Number.isInteger(value) || value < 0) {
      details.push('minGames must be a non-negative integer')
    } else {
      minGames = value
    }
  }

  let sort = 'wins'
  if (query.sort != null && query.sort !== '') {
    if (!LEADERBOARD_SORT_FIELDS.includes(query.sort)) {
      details.push(`sort must be one of: ${LEADERBOARD_SORT_FIELDS.join(', ')}`)
    } else {
      sort = query.sort
    }
  }

  let order = 'desc'
  if (query.order != null && query.order !== '') {
    if (!LEADERBOARD_SORT_ORDERS.includes(query.order)) {
      details.push('order must be asc or desc')
    } else {
      order = query.order
    }
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return { page, limit, search, minGames, sort, order }
}

const toLeaderboardEntry = (entry, rank) => ({
  rank,
  userId: entry.userId,
  username: entry.username,
  displayName: entry.displayName,
  totalWins: Number(entry.totalWins || 0),
  totalScore: Number(entry.totalScore || 0),
  gamesPlayed: Number(entry.gamesPlayed || 0),
  winRate: Number(entry.winRate || 0),
})

/**
 * Shapes a finished in-memory game state into the repository's save contract.
 * The repository validates winner counts (COMPLETED: exactly one, ABANDONED:
 * zero), which this mapping guarantees by flagging only the recorded winner
 * and only for completed games. Scores are 0 until the engine computes real
 * ones (#197).
 */
const buildGameResultPayload = (state) => ({
  startedAt: state.startedAt,
  endedAt: state.endedAt,
  status: state.status,
  players: state.players.map((player) => ({
    userId: player.userId,
    score: 0,
    isWinner: state.status === 'COMPLETED' && player.userId === state.winner,
  })),
})

/**
 * Flushes a finished game to PostgreSQL. saveGameResult recomputes the
 * players' denormalized stats and refreshes every rank in the same
 * transaction, so the leaderboard includes the game as soon as this
 * resolves — persist before emitting game_over (#203).
 */
const persistGameResult = (state) => {
  return gameRepository.saveGameResult(buildGameResultPayload(state))
}

const getLeaderboard = async (query) => {
  const { page, limit, search, minGames, sort, order } =
    parseLeaderboardQuery(query)
  const offset = (page - 1) * limit

  const [entries, totalCount] = await Promise.all([
    gameRepository.getLeaderboard({
      limit,
      offset,
      search,
      minGames,
      sort,
      order,
    }),
    gameRepository.countLeaderboardPlayers({ search, minGames }),
  ])

  return {
    leaderboard: entries.map((entry, index) =>
      toLeaderboardEntry(entry, offset + index + 1),
    ),
    pagination: { page, limit, totalCount },
  }
}

module.exports = {
  buildGameResultPayload,
  getLeaderboard,
  parseLeaderboardQuery,
  persistGameResult,
}
