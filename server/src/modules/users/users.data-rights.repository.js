const prisma = require('#db/prisma')

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

const gamePlayerExportSelect = {
  gameId: true,
  score: true,
  isWinner: true,
  createdAt: true,
  updatedAt: true,
  game: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      createdAt: true,
      updatedAt: true,
      players: {
        select: {
          userId: true,
          score: true,
          isWinner: true,
          user: {
            select: publicUserSelect,
          },
        },
      },
    },
  },
}

const friendshipExportSelect = {
  id: true,
  requesterId: true,
  addresseeId: true,
  status: true,
  blockedById: true,
  createdAt: true,
  updatedAt: true,
  requester: {
    select: publicUserSelect,
  },
  addressee: {
    select: publicUserSelect,
  },
}

const roomExportSelect = {
  id: true,
  name: true,
  capacity: true,
  status: true,
  gameId: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: publicUserSelect,
  },
  players: {
    select: {
      userId: true,
      createdAt: true,
      user: {
        select: publicUserSelect,
      },
    },
  },
}

const apiKeyExportSelect = {
  id: true,
  name: true,
  keyPrefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
}

const accountExportSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  fortyTwoId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  termsAcceptedAt: true,
  privacyAcceptedAt: true,
  deletedAt: true,
  gamesPlayed: true,
  wins: true,
  losses: true,
  rank: true,
  twoFactorEnabled: true,
  apiKeys: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: apiKeyExportSelect,
  },
  games: {
    orderBy: [
      { game: { endedAt: 'desc' } },
      { game: { startedAt: 'desc' } },
      { id: 'desc' },
    ],
    select: gamePlayerExportSelect,
  },
  outgoingFriendships: {
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    select: friendshipExportSelect,
  },
  incomingFriendships: {
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    select: friendshipExportSelect,
  },
  ownedRooms: {
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    select: roomExportSelect,
  },
  roomMemberships: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      roomId: true,
      createdAt: true,
      room: {
        select: roomExportSelect,
      },
    },
  },
}

const deletionCandidateSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  deletedAt: true,
}

const findAccountExportById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: accountExportSelect,
  })
}

const findDeletionCandidateById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: deletionCandidateSelect,
  })
}

const anonymizeUserById = ({ data, deletedAt, userId }) => {
  return prisma.$transaction(async (tx) => {
    await tx.apiKey.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: deletedAt },
    })

    await tx.userTwoFactorRecoveryCode.deleteMany({
      where: { userId },
    })

    await tx.room.updateMany({
      where: { ownerId: userId, status: 'OPEN' },
      data: { status: 'CLOSED' },
    })

    await tx.roomPlayer.deleteMany({
      where: {
        userId,
        room: {
          is: {
            status: 'OPEN',
          },
        },
      },
    })

    return tx.user.update({
      where: { id: userId },
      data,
      select: deletionCandidateSelect,
    })
  })
}

module.exports = {
  anonymizeUserById,
  findAccountExportById,
  findDeletionCandidateById,
}
