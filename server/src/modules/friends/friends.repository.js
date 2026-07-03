const prisma = require('#db/prisma')

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
}

const friendshipSelect = {
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

const findPublicUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  })
}

const findFriendshipById = (id, db = prisma) => {
  return db.friendship.findUnique({
    where: { id },
    select: friendshipSelect,
  })
}

const findRelationshipBetweenUsers = (firstUserId, secondUserId) => {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        {
          requesterId: firstUserId,
          addresseeId: secondUserId,
        },
        {
          requesterId: secondUserId,
          addresseeId: firstUserId,
        },
      ],
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    select: friendshipSelect,
  })
}

const createFriendRequest = (requesterId, addresseeId) => {
  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
    },
    select: friendshipSelect,
  })
}

const withLockedFriendshipById = (id, callback) => {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT "id"
      FROM "Friendship"
      WHERE "id" = ${id}
      FOR UPDATE
    `
    const lockedRelationship = rows[0]
      ? await findFriendshipById(rows[0].id, tx)
      : null

    return await callback(lockedRelationship, tx)
  })
}

const acceptFriendRequestById = (id, db = prisma) => {
  return db.friendship.update({
    where: { id },
    data: {
      status: 'ACCEPTED',
      blockedById: null,
    },
    select: friendshipSelect,
  })
}

const deleteFriendshipById = (id, db = prisma) => {
  return db.friendship.delete({
    where: { id },
    select: friendshipSelect,
  })
}

const listAcceptedFriendshipsForUser = (userId) => {
  return prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    select: friendshipSelect,
  })
}

const listPendingIncomingRequestsForUser = (userId) => {
  return prisma.friendship.findMany({
    where: {
      status: 'PENDING',
      addresseeId: userId,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: friendshipSelect,
  })
}

const listPendingOutgoingRequestsForUser = (userId) => {
  return prisma.friendship.findMany({
    where: {
      status: 'PENDING',
      requesterId: userId,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: friendshipSelect,
  })
}

module.exports = {
  acceptFriendRequestById,
  createFriendRequest,
  deleteFriendshipById,
  findFriendshipById,
  findPublicUserById,
  findRelationshipBetweenUsers,
  listAcceptedFriendshipsForUser,
  listPendingIncomingRequestsForUser,
  listPendingOutgoingRequestsForUser,
  withLockedFriendshipById,
}
