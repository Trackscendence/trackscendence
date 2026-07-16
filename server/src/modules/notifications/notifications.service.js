const BadRequestException = require('#exceptions/bad-request.exception')
const friendsRepository = require('#modules/friends/friends.repository')
const notificationsRepository = require('#modules/notifications/notifications.repository')

const NOTIFICATION_HISTORY_LIMIT = 40
const PRISMA_INT_MAX = 2147483647

const SOCIAL_NOTIFICATION_TYPE = {
  DIRECT_MESSAGE: 'DIRECT_MESSAGE',
  FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  TOURNAMENT_JOINED: 'TOURNAMENT_JOINED',
}

const parsePositiveInteger = (value, fieldName) => {
  const number = Number(value)

  if (!Number.isInteger(number) || number < 1) {
    throw new BadRequestException('Invalid request data', {
      details: [`${fieldName} must be a positive integer`],
    })
  }

  if (number > PRISMA_INT_MAX) {
    throw new BadRequestException('Invalid request data', {
      details: [`${fieldName} must not be greater than ${PRISMA_INT_MAX}`],
    })
  }

  return number
}

const toNotificationUser = (user) => {
  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }
}

const toNotificationDto = (notification, friendRequestStatus = null) => ({
  id: notification.id,
  type: notification.type,
  message: notification.message,
  conversationId: notification.conversationId,
  directMessageId: notification.directMessageId,
  friendRequestStatus,
  isRead: Boolean(notification.readAt),
  readAt: notification.readAt,
  createdAt: notification.createdAt,
  actor: toNotificationUser(notification.actor),
})

const getFriendRequestStatus = async (notification, friendshipRepository) => {
  if (
    notification.type !== SOCIAL_NOTIFICATION_TYPE.FRIEND_REQUEST ||
    !notification.actorId
  ) {
    return null
  }

  const relationship = await friendshipRepository.findRelationshipBetweenUsers(
    notification.userId,
    notification.actorId,
  )

  return relationship?.status || null
}

const createFriendRequestNotification = (
  { actorId, message, userId },
  { repository = notificationsRepository, db } = {},
) => {
  return repository.createNotification(
    {
      actorId,
      message: message || null,
      type: SOCIAL_NOTIFICATION_TYPE.FRIEND_REQUEST,
      userId,
    },
    db,
  )
}

const createFriendAcceptedNotification = (
  { actorId, userId },
  { repository = notificationsRepository, db } = {},
) => {
  return repository.createNotification(
    {
      actorId,
      type: SOCIAL_NOTIFICATION_TYPE.FRIEND_ACCEPTED,
      userId,
    },
    db,
  )
}

const createDirectMessageNotification = (
  { actorId, conversationId, directMessageId, message, userId },
  { repository = notificationsRepository, db } = {},
) => {
  return repository.createNotification(
    {
      actorId,
      conversationId,
      directMessageId,
      message,
      type: SOCIAL_NOTIFICATION_TYPE.DIRECT_MESSAGE,
      userId,
    },
    db,
  )
}

const createTournamentJoinedNotification = (
  { actorId, userId },
  { repository = notificationsRepository, db } = {},
) => {
  return repository.createNotification(
    {
      actorId,
      type: SOCIAL_NOTIFICATION_TYPE.TOURNAMENT_JOINED,
      userId,
    },
    db,
  )
}

const attachConversationToFriendRequestNotification = (
  { actorId, conversationId, userId },
  { repository = notificationsRepository, db } = {},
) => {
  return repository.attachConversationToLatestFriendRequest(
    { actorId, conversationId, userId },
    db,
  )
}

const listNotifications = async (
  user,
  {
    friendshipRepository = friendsRepository,
    repository = notificationsRepository,
  } = {},
) => {
  const [notifications, unreadCount] = await Promise.all([
    repository.listNotificationsForUser(user.id, NOTIFICATION_HISTORY_LIMIT),
    repository.countUnreadNotificationsForUser(user.id),
  ])
  const enrichedNotifications = await Promise.all(
    notifications.map(async (notification) =>
      toNotificationDto(
        notification,
        await getFriendRequestStatus(notification, friendshipRepository),
      ),
    ),
  )

  return {
    notifications: enrichedNotifications,
    unreadCount,
  }
}

const markNotificationRead = async (
  user,
  params,
  { repository = notificationsRepository } = {},
) => {
  const notificationId = parsePositiveInteger(
    params.notificationId,
    'notificationId',
  )

  await repository.markNotificationReadForUser(notificationId, user.id)
  return listNotifications(user, { repository })
}

const markAllNotificationsRead = async (
  user,
  { repository = notificationsRepository } = {},
) => {
  await repository.markAllNotificationsReadForUser(user.id)
  return listNotifications(user, { repository })
}

module.exports = {
  SOCIAL_NOTIFICATION_TYPE,
  attachConversationToFriendRequestNotification,
  createDirectMessageNotification,
  createFriendAcceptedNotification,
  createFriendRequestNotification,
  createTournamentJoinedNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  toNotificationDto,
}
