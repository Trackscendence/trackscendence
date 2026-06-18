const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const { toSafeAuthUser } = require('#modules/auth/auth.service')
const usersRepository = require('#modules/users/users.repository')

const DISPLAY_NAME_MAX_LENGTH = 40
const BIO_MAX_LENGTH = 280
const MATCH_HISTORY_LIMIT = 10
const INVALID_TOKEN_MESSAGE = 'Invalid or expired token'

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const isRecordNotFoundError = (error) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  )
}

const normalizeUpdatableTextField = ({
  details,
  fieldName,
  maxLength,
  value,
}) => {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    details.push(`${fieldName} must be a string`)
    return undefined
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  if (normalizedValue.length > maxLength) {
    details.push(`${fieldName} must be at most ${maxLength} characters`)
    return undefined
  }

  return normalizedValue
}

const validateUpdateProfileInput = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('Invalid request data', {
      details: ['Request body must be an object'],
    })
  }

  const details = []
  const data = {}
  let hasUpdatableField = false

  if (hasOwn(payload, 'displayName')) {
    hasUpdatableField = true
    const displayName = normalizeUpdatableTextField({
      details,
      fieldName: 'displayName',
      maxLength: DISPLAY_NAME_MAX_LENGTH,
      value: payload.displayName,
    })

    if (displayName !== undefined) {
      data.displayName = displayName
    }
  }

  if (hasOwn(payload, 'bio')) {
    hasUpdatableField = true
    const bio = normalizeUpdatableTextField({
      details,
      fieldName: 'bio',
      maxLength: BIO_MAX_LENGTH,
      value: payload.bio,
    })

    if (bio !== undefined) {
      data.bio = bio
    }
  }

  if (!hasUpdatableField) {
    details.push('At least one updatable field is required')
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return data
}

const toProfileStats = (user) => ({
  gamesPlayed: user.gamesPlayed,
  wins: user.wins,
  losses: user.losses,
  rank: user.rank,
})

const toRecentMatch = (match, currentUserId) => {
  const opponents = match.game.players
    .filter((player) => player.userId !== currentUserId)
    .map((player) => ({
      id: player.user.id,
      username: player.user.username,
      displayName: player.user.displayName,
      score: player.score,
      isWinner: player.isWinner,
    }))

  const result = match.isWinner
    ? 'WIN'
    : match.game.status === 'ABANDONED'
      ? 'ABANDONED'
      : 'LOSS'

  return {
    gameId: match.game.id,
    status: match.game.status,
    result,
    score: match.score,
    startedAt: match.game.startedAt,
    endedAt: match.game.endedAt,
    opponents,
  }
}

const toPublicProfile = (user, recentMatches) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  bio: user.bio,
  createdAt: user.createdAt,
  stats: toProfileStats(user),
  recentMatches,
})

const getProfileByUsername = async (username) => {
  const normalizedUsername = typeof username === 'string' ? username.trim() : ''

  if (!normalizedUsername) {
    throw new BadRequestException('Invalid request data', {
      details: ['username is required'],
    })
  }

  const user =
    await usersRepository.findPublicProfileByUsername(normalizedUsername)

  if (!user) {
    throw new NotFoundException('User not found')
  }

  const recentMatches = await usersRepository.listRecentMatchesForUser(
    user.id,
    MATCH_HISTORY_LIMIT,
  )

  return {
    user: toPublicProfile(
      user,
      recentMatches.map((match) => toRecentMatch(match, user.id)),
    ),
  }
}

const updateCurrentUserProfile = async (user, payload) => {
  const updateData = validateUpdateProfileInput(payload)

  try {
    const updatedUser = await usersRepository.updateProfileById(
      user.id,
      updateData,
    )

    return {
      message: 'Profile updated successfully',
      user: toSafeAuthUser(updatedUser),
    }
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }
}

module.exports = {
  getProfileByUsername,
  updateCurrentUserProfile,
}
