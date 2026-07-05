const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const {
  deleteAvatarFileByUrl,
  storeAvatarFile,
} = require('#modules/users/users.avatar')
const usersRepository = require('#modules/users/users.repository')
const logger = require('#utils/logger')

const DISPLAY_NAME_MAX_LENGTH = 40
const BIO_MAX_LENGTH = 280
const MATCH_HISTORY_LIMIT = 10
const PROFILE_FRIENDS_LIMIT = 6
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
      avatarUrl: player.user.avatarUrl,
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

const toProfileFriend = (friendship, profileUserId) => {
  const user =
    friendship.requesterId === profileUserId
      ? friendship.addressee
      : friendship.requester

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    friendSince: friendship.updatedAt,
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
  const [recentMatches, friends] = await Promise.all([
    usersRepository.listRecentMatchesForUser(user.id, MATCH_HISTORY_LIMIT),
    usersRepository.listPublicFriendsForUser(user.id, PROFILE_FRIENDS_LIMIT),
  ])

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    ...(options.includeEmail ? { email: user.email } : {}),
    stats: toProfileStats(user),
    recentMatches: recentMatches.map((match) => toRecentMatch(match, user.id)),
    friends: friends.map((friendship) => toProfileFriend(friendship, user.id)),
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
    viewer?.id && viewer.id !== user.id
      ? await usersRepository.findRelationshipBetweenUsers(viewer.id, user.id)
      : null

  return {
    user: await getProfileData(user),
    relationship: viewer?.id
      ? toRelationshipState(relationship, viewer.id, user.id)
      : null,
  }
}

const toAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  gamesPlayed: user.gamesPlayed,
  wins: user.wins,
  losses: user.losses,
  rank: user.rank,
  role: user.role,
  createdAt: user.createdAt,
  twoFactorEnabled: Boolean(user.twoFactorEnabled),
  twoFactorSetupPending: Boolean(user.twoFactorPendingSecretCiphertext),
})

const updateCurrentUserProfile = async (viewer, payload) => {
  const updateData = validateUpdateProfileInput(payload)

  try {
    const user = await usersRepository.updateProfileById(viewer.id, updateData)

    return {
      message: 'Profile updated successfully',
      user: await getProfileData(user, { includeEmail: true }),
      authUser: toAuthUser(user),
    }
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }
}

// Best-effort removal of an avatar file that is no longer referenced. The
// database update has already succeeded by the time this runs, so a failed
// file delete only leaks a file on disk — log it, never fail the request.
const cleanupAvatarFile = async (avatarUrl, userId, action) => {
  if (!avatarUrl) {
    return
  }

  try {
    await deleteAvatarFileByUrl({ avatarUrl })
  } catch (error) {
    logger.warn('Failed to clean up avatar file', {
      action,
      error: error.message,
      userId,
    })
  }
}

const uploadCurrentUserAvatar = async (viewer, file) => {
  let createdAvatarUrl = null
  const previousAvatarUrl = viewer.avatarUrl

  try {
    const storedAvatar = await storeAvatarFile({ file, userId: viewer.id })
    createdAvatarUrl = storedAvatar.avatarUrl

    const user = await usersRepository.updateAvatarById(
      viewer.id,
      storedAvatar.avatarUrl,
    )

    await cleanupAvatarFile(previousAvatarUrl, viewer.id, 'replace')

    return {
      message: 'Avatar uploaded successfully',
      user: await getProfileData(user, { includeEmail: true }),
      authUser: toAuthUser(user),
    }
  } catch (error) {
    await cleanupAvatarFile(createdAvatarUrl, viewer.id, 'rollback')

    if (isRecordNotFoundError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }
}

const deleteCurrentUserAvatar = async (viewer) => {
  const previousAvatarUrl = viewer.avatarUrl

  try {
    const user = await usersRepository.updateAvatarById(viewer.id, null)

    await cleanupAvatarFile(previousAvatarUrl, viewer.id, 'delete')

    return {
      message: 'Avatar removed successfully',
      user: await getProfileData(user, { includeEmail: true }),
      authUser: toAuthUser(user),
    }
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }
}

module.exports = {
  deleteCurrentUserAvatar,
  getCurrentProfile,
  getProfileByUsername,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
}
