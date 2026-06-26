const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const usersRepository = require('#modules/users/users.repository')

const DISPLAY_NAME_MAX_LENGTH = 40
const BIO_MAX_LENGTH = 280
const MATCH_HISTORY_LIMIT = 10
const USERNAME_REGEX = /^[a-z][a-z0-9]*$/
const USERNAME_MIN_LENGTH = 6
const USERNAME_MAX_LENGTH = 32
const INVALID_TOKEN_MESSAGE = 'Invalid or expired token'

const FRIENDSHIP_STATUS = {
  ACCEPTED: 'ACCEPTED',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING',
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const isRecordNotFoundError = (error) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  )
}

const normalizeUsername = (username) => username.trim().toLowerCase()

const getUsernameValidationMessages = (username) => {
  const details = []

  if (!username) {
    details.push('Username is required')
  } else if (!USERNAME_REGEX.test(username)) {
    details.push(
      'Username must start with a letter and contain only lowercase letters and numbers',
    )
  } else if (username.length < USERNAME_MIN_LENGTH) {
    details.push(
      `Username must not be less than ${USERNAME_MIN_LENGTH} characters`,
    )
  } else if (username.length > USERNAME_MAX_LENGTH) {
    details.push(
      `Username must not be more than ${USERNAME_MAX_LENGTH} characters`,
    )
  }

  return details
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

const toProfileStats = (stats, rank) => ({
  gamesPlayed: Number(stats.gamesPlayed || 0),
  wins: Number(stats.wins || 0),
  losses: Number(stats.losses || 0),
  rank,
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

const toRelationshipState = (relationship, viewerId, profileUserId) => {
  if (viewerId === profileUserId) {
    return { status: 'SELF' }
  }

  if (!relationship) {
    return { status: 'NONE' }
  }

  if (relationship.status === FRIENDSHIP_STATUS.ACCEPTED) {
    return { status: 'FRIENDS', updatedAt: relationship.updatedAt }
  }

  if (relationship.status === FRIENDSHIP_STATUS.BLOCKED) {
    return { status: 'BLOCKED' }
  }

  if (relationship.requesterId === viewerId) {
    return { status: 'PENDING_OUTGOING', requestedAt: relationship.createdAt }
  }

  return { status: 'PENDING_INCOMING', requestedAt: relationship.createdAt }
}

const getProfileData = async (user, options = {}) => {
  const [stats, rank, recentMatches] = await Promise.all([
    usersRepository.getStatsForUser(user.id),
    usersRepository.getRankForUser(user.id),
    usersRepository.listRecentMatchesForUser(user.id, MATCH_HISTORY_LIMIT),
  ])

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    createdAt: user.createdAt,
    ...(options.includeEmail ? { email: user.email } : {}),
    stats: toProfileStats(stats, rank),
    recentMatches: recentMatches.map((match) => toRecentMatch(match, user.id)),
  }
}

const getCurrentProfile = async (viewer) => {
  const user = await usersRepository.findSelfProfileById(viewer.id)

  if (!user) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  return {
    user: await getProfileData(user, { includeEmail: true }),
    relationship: { status: 'SELF' },
  }
}

const getProfileByUsername = async (viewer, username) => {
  const normalizedUsername =
    typeof username === 'string' ? normalizeUsername(username) : ''
  const details = getUsernameValidationMessages(normalizedUsername)

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  const user =
    await usersRepository.findPublicProfileByUsername(normalizedUsername)

  if (!user) {
    throw new NotFoundException('User not found')
  }

  const relationship =
    viewer.id === user.id
      ? null
      : await usersRepository.findRelationshipBetweenUsers(viewer.id, user.id)

  return {
    user: await getProfileData(user),
    relationship: toRelationshipState(relationship, viewer.id, user.id),
  }
}

const updateCurrentUserProfile = async (viewer, payload) => {
  const updateData = validateUpdateProfileInput(payload)

  try {
    const user = await usersRepository.updateProfileById(viewer.id, updateData)

    return {
      message: 'Profile updated successfully',
      user: await getProfileData(user, { includeEmail: true }),
      authUser: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        twoFactorSetupPending: Boolean(user.twoFactorPendingSecretCiphertext),
      },
    }
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }
}

module.exports = {
  getCurrentProfile,
  getProfileByUsername,
  updateCurrentUserProfile,
}
