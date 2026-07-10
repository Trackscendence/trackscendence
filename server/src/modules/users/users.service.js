const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const {
  deleteAvatarFileByUrl,
  storeAvatarFile,
} = require('#modules/users/users.avatar')
const usersRepository = require('#modules/users/users.repository')
const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  parsePositiveInteger,
} = require('#utils/query-parsing')
const logger = require('#utils/logger')

const DISPLAY_NAME_MAX_LENGTH = 40
const BIO_MAX_LENGTH = 280
const SEARCH_QUERY_MAX_LENGTH = 50
const MATCH_HISTORY_LIMIT = 10
const PROFILE_FRIENDS_LIMIT = 6
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

const getProfileData = async (
  user,
  options = {},
  { repository = usersRepository } = {},
) => {
  const [recentMatches, friends, friendsCount] = await Promise.all([
    repository.listRecentMatchesForUser(user.id, MATCH_HISTORY_LIMIT),
    repository.listPublicFriendsForUser(user.id, PROFILE_FRIENDS_LIMIT),
    // The full accepted-friend total (#396): the list above is a capped
    // preview, so the stat strip needs its own count, and this way public
    // profiles show it even where the friends list itself stays private.
    repository.countAcceptedFriendsForUser(user.id),
  ])

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    ...(options.includeEmail ? { email: user.email } : {}),
    isGuest: Boolean(user.isGuest),
    stats: { ...toProfileStats(user), friendsCount },
    recentMatches: recentMatches.map((match) => toRecentMatch(match, user.id)),
    friends: friends.map((friendship) => toProfileFriend(friendship, user.id)),
  }
}

/**
 * Validates and normalizes the user search query string. Collects every
 * violation into one 400 so the caller sees all bad fields at once.
 */
const parseUserSearchQuery = (query = {}) => {
  const details = []

  let q = ''
  if (typeof query.q !== 'string' && query.q != null) {
    details.push('q must be a string')
  } else {
    q = typeof query.q === 'string' ? query.q.trim() : ''

    if (!q) {
      details.push('q is required')
    } else if (q.length > SEARCH_QUERY_MAX_LENGTH) {
      details.push(`q must be at most ${SEARCH_QUERY_MAX_LENGTH} characters`)
    }
  }

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

  return { q, page, limit }
}

const searchUsers = async (query) => {
  const { q, page, limit } = parseUserSearchQuery(query)
  const offset = (page - 1) * limit

  const { users, totalCount } = await usersRepository.searchUsersByName({
    query: q,
    limit,
    offset,
  })

  return {
    users,
    pagination: { page, limit, totalCount },
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
  // Lookups only require a non-empty name. Signup-format rules (length,
  // charset) live in auth.service; enforcing them here made every profile
  // whose name predates those rules unreachable with a 400.
  const normalizedUsername =
    typeof username === 'string' ? normalizeUsername(username) : ''

  if (!normalizedUsername) {
    throw new BadRequestException('Invalid request data', {
      details: ['Username is required'],
    })
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
  getProfileData,
  getProfileByUsername,
  parseUserSearchQuery,
  searchUsers,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
}
