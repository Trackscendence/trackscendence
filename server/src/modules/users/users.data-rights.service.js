const BadRequestException = require('#exceptions/bad-request.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const { deleteAvatarFileByUrl } = require('#modules/users/users.avatar')
const dataRightsRepository = require('#modules/users/users.data-rights.repository')
const logger = require('#utils/logger')

const INVALID_TOKEN_MESSAGE = 'Invalid or expired token'

const validateDeleteAccountInput = (payload = {}, username) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('Invalid request data', {
      details: ['Request body must be an object'],
    })
  }

  const confirmation =
    typeof payload.confirmation === 'string' ? payload.confirmation.trim() : ''

  if (confirmation !== username) {
    throw new BadRequestException('Invalid request data', {
      details: ['Type your username to confirm account deletion'],
    })
  }

  return { confirmation }
}

const toIdentity = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
})

const toFriendshipExport = (friendship) => ({
  id: friendship.id,
  status: friendship.status,
  blockedById: friendship.blockedById,
  createdAt: friendship.createdAt,
  updatedAt: friendship.updatedAt,
  requester: toIdentity(friendship.requester),
  addressee: toIdentity(friendship.addressee),
})

const toRoomExport = (room) => ({
  id: room.id,
  name: room.name,
  capacity: room.capacity,
  status: room.status,
  gameId: room.gameId,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
  owner: toIdentity(room.owner),
  players: room.players.map((player) => ({
    userId: player.userId,
    joinedAt: player.createdAt,
    user: toIdentity(player.user),
  })),
})

const toGameExport = (gamePlayer) => ({
  gameId: gamePlayer.gameId,
  score: gamePlayer.score,
  isWinner: gamePlayer.isWinner,
  joinedAt: gamePlayer.createdAt,
  updatedAt: gamePlayer.updatedAt,
  game: {
    id: gamePlayer.game.id,
    status: gamePlayer.game.status,
    startedAt: gamePlayer.game.startedAt,
    endedAt: gamePlayer.game.endedAt,
    createdAt: gamePlayer.game.createdAt,
    updatedAt: gamePlayer.game.updatedAt,
    players: gamePlayer.game.players.map((player) => ({
      userId: player.userId,
      score: player.score,
      isWinner: player.isWinner,
      user: toIdentity(player.user),
    })),
  },
})

const buildAccountDataExport = (user, generatedAt = new Date()) => ({
  generatedAt,
  account: {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    fortyTwoId: user.fortyTwoId,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    termsAcceptedAt: user.termsAcceptedAt,
    privacyAcceptedAt: user.privacyAcceptedAt,
    deletedAt: user.deletedAt,
  },
  stats: {
    gamesPlayed: user.gamesPlayed,
    wins: user.wins,
    losses: user.losses,
    rank: user.rank,
  },
  security: {
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    apiKeys: user.apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      lastUsedAt: apiKey.lastUsedAt,
      revokedAt: apiKey.revokedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    })),
  },
  games: user.games.map(toGameExport),
  friendships: [
    ...user.outgoingFriendships.map(toFriendshipExport),
    ...user.incomingFriendships.map(toFriendshipExport),
  ],
  rooms: {
    owned: user.ownedRooms.map(toRoomExport),
    joined: user.roomMemberships.map((membership) => ({
      roomId: membership.roomId,
      joinedAt: membership.createdAt,
      room: toRoomExport(membership.room),
    })),
  },
})

const buildAnonymizedUserData = (userId, deletedAt = new Date()) => ({
  email: `deleted-${userId}@deleted.trackscendence.invalid`,
  username: `deleted-${userId}`,
  displayName: 'Deleted user',
  bio: null,
  avatarUrl: null,
  passwordHash: null,
  fortyTwoId: null,
  passwordResetTokenId: null,
  passwordResetTokenHash: null,
  passwordResetTokenExpiry: null,
  twoFactorChallengeVersion: { increment: 1 },
  twoFactorEnabled: false,
  twoFactorSecretCiphertext: null,
  twoFactorPendingSecretCiphertext: null,
  failedLoginCount: 0,
  lockedOutUntil: null,
  tokenVersion: { increment: 1 },
  deletedAt,
})

const exportCurrentUserData = async (viewer) => {
  const user = await dataRightsRepository.findAccountExportById(viewer.id)

  if (!user || user.deletedAt) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  return buildAccountDataExport(user)
}

const cleanupAvatarFile = async (avatarUrl, userId) => {
  if (!avatarUrl) return

  try {
    await deleteAvatarFileByUrl({ avatarUrl })
  } catch (error) {
    logger.warn('Failed to clean up avatar file after account deletion', {
      error: error.message,
      userId,
    })
  }
}

const deleteCurrentUserAccount = async (viewer, payload) => {
  validateDeleteAccountInput(payload, viewer.username)

  const user = await dataRightsRepository.findDeletionCandidateById(viewer.id)

  if (!user || user.deletedAt) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  const deletedAt = new Date()
  await dataRightsRepository.anonymizeUserById({
    data: buildAnonymizedUserData(viewer.id, deletedAt),
    deletedAt,
    userId: viewer.id,
  })
  await cleanupAvatarFile(user.avatarUrl, viewer.id)

  return {
    message: 'Account deleted',
    deletedAt,
  }
}

module.exports = {
  buildAccountDataExport,
  buildAnonymizedUserData,
  deleteCurrentUserAccount,
  exportCurrentUserData,
  validateDeleteAccountInput,
}
