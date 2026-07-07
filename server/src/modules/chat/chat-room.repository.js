const prisma = require('#db/prisma')

const chatUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

const membershipSelect = {
  id: true,
  roomId: true,
  userId: true,
  role: true,
  status: true,
  isMuted: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: chatUserSelect,
  },
  invitedBy: {
    select: chatUserSelect,
  },
}

const roomInclude = {
  createdBy: {
    select: chatUserSelect,
  },
  memberships: {
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    select: membershipSelect,
  },
}

const messageSelect = {
  id: true,
  roomId: true,
  userId: true,
  message: true,
  createdAt: true,
  user: {
    select: chatUserSelect,
  },
}

const findPublicUserById = (id) => {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: chatUserSelect,
  })
}

const listVisibleRoomsForUser = (userId) => {
  return prisma.chatRoom.findMany({
    where: {
      OR: [
        { visibility: 'PUBLIC' },
        {
          memberships: {
            some: {
              userId,
              status: { in: ['ACTIVE', 'INVITED'] },
            },
          },
        },
      ],
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    include: roomInclude,
  })
}

const findRoomById = (id) => {
  return prisma.chatRoom.findUnique({
    where: { id },
    include: roomInclude,
  })
}

const createRoom = ({ createdById, name, visibility }) => {
  const now = new Date()
  return prisma.chatRoom.create({
    data: {
      name,
      visibility,
      createdById,
      memberships: {
        create: {
          userId: createdById,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: now,
        },
      },
    },
    include: roomInclude,
  })
}

const upsertMembership = ({
  invitedById = null,
  isMuted = false,
  joinedAt = null,
  role = 'MEMBER',
  roomId,
  status,
  userId,
}) => {
  return prisma.chatRoomMember.upsert({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    create: {
      invitedById,
      isMuted,
      joinedAt,
      role,
      roomId,
      status,
      userId,
    },
    update: {
      invitedById,
      isMuted,
      joinedAt,
      role,
      status,
    },
    select: membershipSelect,
  })
}

const updateMembership = (id, data) => {
  return prisma.chatRoomMember.update({
    where: { id },
    data,
    select: membershipSelect,
  })
}

const listActiveRoomIdsForUser = async (userId) => {
  const memberships = await prisma.chatRoomMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { roomId: true },
  })

  return memberships.map((membership) => membership.roomId)
}

const listActiveMemberUserIdsForRoom = async (roomId) => {
  const memberships = await prisma.chatRoomMember.findMany({
    where: { roomId, status: 'ACTIVE' },
    select: { userId: true },
  })

  return memberships.map((membership) => membership.userId)
}

const createMessage = ({ message, roomId, userId }) => {
  return prisma.chatMessage.create({
    data: { message, roomId, userId },
    select: messageSelect,
  })
}

const listMessagesForRoom = (roomId, limit) => {
  return prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: messageSelect,
  })
}

module.exports = {
  createMessage,
  createRoom,
  findPublicUserById,
  findRoomById,
  listActiveRoomIdsForUser,
  listActiveMemberUserIdsForRoom,
  listMessagesForRoom,
  listVisibleRoomsForUser,
  updateMembership,
  upsertMembership,
}
