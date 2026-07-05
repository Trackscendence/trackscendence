const BadRequestException = require('#exceptions/bad-request.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const gameRepository = require('#modules/game/game.repository')
const usersRepository = require('#modules/users/users.repository')
const usersService = require('#modules/users/users.service')
const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  parsePositiveInteger,
} = require('#utils/query-parsing')

const parsePagination = (query = {}) => {
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

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return { page, limit }
}

const normalizeUsername = (rawUsername) => {
  const username =
    typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase() : ''

  if (!username) {
    throw new BadRequestException('Invalid request data', {
      details: ['Username is required'],
    })
  }

  return username
}

const findUserByUsernameOrThrow = async (rawUsername) => {
  const user = await usersRepository.findPublicProfileByUsername(
    normalizeUsername(rawUsername),
  )

  if (!user) {
    throw new NotFoundException('User not found')
  }

  return user
}

const toPublicMatch = (match, profileUserId) => {
  const result = match.isWinner
    ? 'WIN'
    : match.game.status === 'ABANDONED'
      ? 'ABANDONED'
      : 'LOSS'

  return {
    gameId: match.game.id,
    status: match.game.status,
    result,
    startedAt: match.game.startedAt,
    endedAt: match.game.endedAt,
    players: match.game.players.map((player) => ({
      id: player.user.id,
      username: player.user.username,
      displayName: player.user.displayName,
      score: player.score,
      isWinner: player.isWinner,
      isProfileUser: player.userId === profileUserId,
    })),
  }
}

const getLeaderboard = async (query) => {
  const { page, limit } = parsePagination(query)
  const offset = (page - 1) * limit

  const [entries, totalCount] = await Promise.all([
    gameRepository.getLeaderboard({ limit, offset }),
    gameRepository.countLeaderboardPlayers(),
  ])

  return {
    leaderboard: entries.map((entry, index) => ({
      rank: offset + index + 1,
      userId: entry.userId,
      username: entry.username,
      displayName: entry.displayName,
      totalWins: Number(entry.totalWins || 0),
      totalScore: Number(entry.totalScore || 0),
    })),
    pagination: { page, limit, totalCount },
  }
}

const getUserProfile = async (rawUsername) => {
  // Lifetime stats live directly on the User row (denormalized by the game
  // save transaction), so the profile select already carries them.
  const { gamesPlayed, wins, losses, rank, ...user } =
    await findUserByUsernameOrThrow(rawUsername)

  return {
    user: {
      ...user,
      stats: {
        gamesPlayed: Number(gamesPlayed || 0),
        wins: Number(wins || 0),
        losses: Number(losses || 0),
        rank: rank ?? null,
      },
    },
  }
}

const getUserMatches = async (rawUsername, query) => {
  const { limit } = parsePagination(query)
  const user = await findUserByUsernameOrThrow(rawUsername)
  const matches = await usersRepository.listRecentMatchesForUser(user.id, limit)

  return {
    matches: matches.map((match) => toPublicMatch(match, user.id)),
  }
}

const updateOwnProfile = async (viewer, payload) => {
  const result = await usersService.updateCurrentUserProfile(viewer, payload)

  return {
    message: 'Profile updated successfully',
    user: {
      id: result.user.id,
      username: result.user.username,
      displayName: result.user.displayName,
      bio: result.user.bio,
      createdAt: result.user.createdAt,
    },
  }
}

module.exports = {
  getLeaderboard,
  getUserMatches,
  getUserProfile,
  updateOwnProfile,
}
