const BadRequestException = require('#exceptions/bad-request.exception')
const adminRepository = require('#modules/admin/admin.repository')
const gameStore = require('#modules/game/game.store')
const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  parsePositiveInteger,
} = require('#utils/query-parsing')

const USER_STATUSES = new Set(['ACTIVE', 'SUSPENDED', 'BANNED'])
const USER_ROLES = new Set(['USER', 'ADMIN'])
const MAX_SEARCH_LENGTH = 100

const getAccess = (user) => ({
  message: 'Admin access granted',
  user: {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  },
})

const getStats = async ({
  repository = adminRepository,
  store = gameStore,
} = {}) => {
  const [databaseStats, games] = await Promise.all([
    repository.getStats(),
    store.getAllGames(),
  ])

  return {
    stats: {
      ...databaseStats,
      activeGames: games.filter((game) => game.status === 'IN_PROGRESS').length,
      openReports: 0,
    },
  }
}

const parseUsersQuery = ({ q, status, role, page, limit } = {}) => {
  const details = []
  const query = typeof q === 'string' ? q.trim() : ''
  const normalizedStatus = typeof status === 'string' ? status.trim() : ''
  const normalizedRole = typeof role === 'string' ? role.trim() : ''
  const parsedPage = parsePositiveInteger({
    details,
    fieldName: 'page',
    rawValue: page,
    fallback: 1,
    max: MAX_PAGE,
  })
  const parsedLimit = parsePositiveInteger({
    details,
    fieldName: 'limit',
    rawValue: limit,
    fallback: DEFAULT_PAGE_SIZE,
    max: MAX_PAGE_SIZE,
  })

  if (query.length > MAX_SEARCH_LENGTH) {
    details.push(`q must not exceed ${MAX_SEARCH_LENGTH} characters`)
  }
  if (normalizedStatus && !USER_STATUSES.has(normalizedStatus)) {
    details.push('status must be ACTIVE, SUSPENDED, or BANNED')
  }
  if (normalizedRole && !USER_ROLES.has(normalizedRole)) {
    details.push('role must be USER or ADMIN')
  }
  if (details.length > 0) {
    throw new BadRequestException('Invalid query parameters', { details })
  }

  return {
    query,
    status: normalizedStatus,
    role: normalizedRole,
    page: parsedPage,
    limit: parsedLimit,
  }
}

const listUsers = async (query, { repository = adminRepository } = {}) => {
  const filters = parseUsersQuery(query)
  const { users, totalCount } = await repository.listUsers({
    ...filters,
    offset: (filters.page - 1) * filters.limit,
  })

  return {
    users,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      totalCount,
    },
  }
}

module.exports = {
  getAccess,
  getStats,
  listUsers,
  parseUsersQuery,
}
