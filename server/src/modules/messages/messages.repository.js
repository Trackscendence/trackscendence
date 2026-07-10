const { Prisma } = require('@prisma/client')
const prisma = require('#db/prisma')

const messageUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  message: true,
  createdAt: true,
  sender: {
    select: messageUserSelect,
  },
}

const conversationInclude = {
  userOne: {
    select: messageUserSelect,
  },
  userTwo: {
    select: messageUserSelect,
  },
  messages: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 1,
    select: messageSelect,
  },
}

const getParticipantPair = (firstUserId, secondUserId) => {
  return firstUserId < secondUserId
    ? { userOneId: firstUserId, userTwoId: secondUserId }
    : { userOneId: secondUserId, userTwoId: firstUserId }
}

const isUniqueConstraintError = (error) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

const withTransaction = (callback) => {
  return prisma.$transaction(callback)
}

const findPublicUserById = (id, db = prisma) => {
  return db.user.findFirst({
    where: { id, deletedAt: null },
    select: messageUserSelect,
  })
}

const findConversationById = (id, db = prisma) => {
  return db.directConversation.findUnique({
    where: { id },
    include: conversationInclude,
  })
}

const findConversationByUsers = (firstUserId, secondUserId, db = prisma) => {
  const pair = getParticipantPair(firstUserId, secondUserId)
  return db.directConversation.findUnique({
    where: { userOneId_userTwoId: pair },
    include: conversationInclude,
  })
}

const createConversationForUsers = async (
  firstUserId,
  secondUserId,
  db = prisma,
) => {
  const pair = getParticipantPair(firstUserId, secondUserId)

  try {
    return await db.directConversation.create({
      data: pair,
      include: conversationInclude,
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error
    return findConversationByUsers(firstUserId, secondUserId, db)
  }
}

const findOrCreateConversationForUsers = async (
  firstUserId,
  secondUserId,
  db = prisma,
) => {
  const existing = await findConversationByUsers(firstUserId, secondUserId, db)
  if (existing) return existing

  return createConversationForUsers(firstUserId, secondUserId, db)
}

// Keyed off participation, not current friendship, by design (#392): a
// conversation stays listed for both users after an unfriend; only sending is
// friend-gated.
const listConversationsForUser = (userId, db = prisma) => {
  return db.directConversation.findMany({
    where: {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    include: conversationInclude,
  })
}

const countUnreadMessagesForConversation = ({
  conversationId,
  lastReadAt,
  userId,
  db = prisma,
}) => {
  return db.directMessage.count({
    where: {
      conversationId,
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  })
}

const createMessage = (
  { conversationId, friendshipRequestId, message, senderId },
  db = prisma,
) => {
  return db.directMessage.create({
    data: {
      conversationId,
      friendshipRequestId,
      message,
      senderId,
    },
    select: messageSelect,
  })
}

const findMessageByFriendshipRequestId = (friendshipRequestId, db = prisma) => {
  return db.directMessage.findUnique({
    where: { friendshipRequestId },
    select: messageSelect,
  })
}

const getReadFieldForUser = (conversation, userId) => {
  if (conversation.userOneId === userId) return 'userOneLastReadAt'
  if (conversation.userTwoId === userId) return 'userTwoLastReadAt'
  return null
}

const markConversationReadForUser = (
  conversation,
  userId,
  readAt = new Date(),
  db = prisma,
) => {
  const readField = getReadFieldForUser(conversation, userId)
  if (!readField) return null

  return db.directConversation.update({
    where: { id: conversation.id },
    data: { [readField]: readAt },
    include: conversationInclude,
  })
}

const listMessagesForConversation = (conversationId, limit, db = prisma) => {
  return db.directMessage.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: messageSelect,
  })
}

module.exports = {
  countUnreadMessagesForConversation,
  createMessage,
  findConversationById,
  findConversationByUsers,
  findOrCreateConversationForUsers,
  findMessageByFriendshipRequestId,
  findPublicUserById,
  getParticipantPair,
  listConversationsForUser,
  listMessagesForConversation,
  markConversationReadForUser,
  withTransaction,
}
