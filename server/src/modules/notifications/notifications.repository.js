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

const markAllNotificationsReadForUser = (userId, db = prisma) => {
  return db.socialNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

module.exports = {
  countUnreadNotificationsForUser,
  createNotification,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
}
