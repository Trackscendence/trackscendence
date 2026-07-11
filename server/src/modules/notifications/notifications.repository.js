const prisma = require('#db/prisma')

const notificationUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

const notificationSelect = {
  id: true,
  userId: true,
  actorId: true,
  type: true,
  message: true,
  conversationId: true,
  directMessageId: true,
  readAt: true,
  createdAt: true,
  actor: {
    select: notificationUserSelect,
  },
}

const createNotification = (
  {
    actorId = null,
    conversationId = null,
    directMessageId = null,
    message = null,
    type,
    userId,
  },
  db = prisma,
) => {
  return db.socialNotification.create({
    data: {
      actorId,
      conversationId,
      directMessageId,
      message,
      type,
      userId,
    },
    select: notificationSelect,
  })
}

const listNotificationsForUser = (userId, limit, db = prisma) => {
  return db.socialNotification.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: notificationSelect,
  })
}

const countUnreadNotificationsForUser = (userId, db = prisma) => {
  return db.socialNotification.count({
    where: { userId, readAt: null },
  })
}

const markNotificationReadForUser = (id, userId, db = prisma) => {
  return db.socialNotification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  })
}

// Stamps the conversation created by an accepted intro-message request onto
// that request's own notification, so clicking it later opens the
// conversation instead of dead-ending on the requester's profile (#395).
// Only the newest intro-message row is touched: the pair-unique friendship
// constraint means the accepted request is always the most recent one, and
// older notifications from rejected or cancelled cycles must keep their
// original routing.
const attachConversationToLatestFriendRequest = async (
  { actorId, conversationId, userId },
  db = prisma,
) => {
  const latestRequest = await db.socialNotification.findFirst({
    where: {
      actorId,
      message: { not: null },
      type: 'FRIEND_REQUEST',
      userId,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true },
  })

  if (!latestRequest) return null

  return db.socialNotification.update({
    where: { id: latestRequest.id },
    data: { conversationId },
  })
}

const markAllNotificationsReadForUser = (userId, db = prisma) => {
  return db.socialNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

module.exports = {
  attachConversationToLatestFriendRequest,
  countUnreadNotificationsForUser,
  createNotification,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
}
