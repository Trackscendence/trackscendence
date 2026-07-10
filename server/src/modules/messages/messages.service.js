const BadRequestException = require('#exceptions/bad-request.exception')
const ForbiddenException = require('#exceptions/forbidden.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const friendsRepository = require('#modules/friends/friends.repository')
const messagesRepository = require('#modules/messages/messages.repository')
const notificationsService = require('#modules/notifications/notifications.service')

const DIRECT_MESSAGE_MAX_LENGTH = 500
const MESSAGE_HISTORY_LIMIT = 100
const PRISMA_INT_MAX = 2147483647

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

const getTrimmedString = (value) => {
  return typeof value === 'string' ? value.trim() : ''
}

const validateMessage = (message) => {
  const normalizedMessage = getTrimmedString(message)

  if (!normalizedMessage) {
    throw new BadRequestException('Invalid request data', {
      details: ['message is required'],
    })
  }

  if (normalizedMessage.length > DIRECT_MESSAGE_MAX_LENGTH) {
    throw new BadRequestException('Invalid request data', {
      details: [
        `message must be at most ${DIRECT_MESSAGE_MAX_LENGTH} characters`,
      ],
    })
  }

  return normalizedMessage
}

const toMessageUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
})

const toMessageDto = (message) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  message: message.message,
  createdAt: message.createdAt,
  user: toMessageUser(message.sender),
})

const getFriendFromConversation = (conversation, viewerId) => {
  return conversation.userOneId === viewerId
    ? conversation.userTwo
    : conversation.userOne
}

const getOtherUserIdFromConversation = (conversation, userId) => {
  if (conversation.userOneId === userId) return conversation.userTwoId
  if (conversation.userTwoId === userId) return conversation.userOneId
  return null
}

const getLastReadAt = (conversation, userId) => {
  if (conversation.userOneId === userId) return conversation.userOneLastReadAt
  if (conversation.userTwoId === userId) return conversation.userTwoLastReadAt
  return null
}

const isConversationParticipant = (conversation, userId) => {
  return conversation.userOneId === userId || conversation.userTwoId === userId
}

const toConversationDto = (conversation, viewerId, unreadCount = 0) => {
  const lastMessage = conversation.messages?.[0] || null
  const friend = getFriendFromConversation(conversation, viewerId)

  return {
    id: conversation.id,
    friend: toMessageUser(friend),
    lastMessage: lastMessage ? toMessageDto(lastMessage) : null,
    unreadCount,
    isUnread: unreadCount > 0,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  }
}

const getConversationUnreadCount = async (
  conversation,
  viewerId,
  repository,
) => {
  return repository.countUnreadMessagesForConversation({
    conversationId: conversation.id,
    lastReadAt: getLastReadAt(conversation, viewerId),
    userId: viewerId,
  })
}

const assertAcceptedFriends = async (
  firstUserId,
  secondUserId,
  { repository = friendsRepository } = {},
) => {
  if (firstUserId === secondUserId) {
    throw new BadRequestException('You cannot message yourself')
  }

  const relationship = await repository.findRelationshipBetweenUsers(
    firstUserId,
    secondUserId,
  )

  if (relationship?.status !== 'ACCEPTED') {
    throw new ForbiddenException(
      'Direct messages are only available between friends',
    )
  }

  return relationship
}

const getConversationOrThrow = async (conversationId, repository) => {
  const conversation = await repository.findConversationById(conversationId)
  if (!conversation) throw new NotFoundException('Conversation not found')
  return conversation
}

const listConversations = async (
  user,
  { repository = messagesRepository } = {},
) => {
  const conversations = await repository.listConversationsForUser(user.id)
  const summaries = await Promise.all(
    conversations.map(async (conversation) =>
      toConversationDto(
        conversation,
        user.id,
        await getConversationUnreadCount(conversation, user.id, repository),
      ),
    ),
  )

  return {
    conversations: summaries,
    unreadCount: summaries.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    ),
  }
}

const markAllConversationsRead = async (
  user,
  { repository = messagesRepository } = {},
) => {
  const conversations = await repository.listConversationsForUser(user.id)
  const readAt = new Date()

  await Promise.all(
    conversations.map((conversation) =>
      repository.markConversationReadForUser(conversation, user.id, readAt),
    ),
  )

  return { unreadCount: 0 }
}

const getOrCreateConversation = async (
  user,
  payload,
  {
    friendshipRepository = friendsRepository,
    repository = messagesRepository,
  } = {},
) => {
  const targetUserId = parsePositiveInteger(
    payload?.targetUserId,
    'targetUserId',
  )
  await assertAcceptedFriends(user.id, targetUserId, {
    repository: friendshipRepository,
  })

  const targetUser = await repository.findPublicUserById(targetUserId)
  if (!targetUser) throw new NotFoundException('Target user not found')

  const conversation = await repository.findOrCreateConversationForUsers(
    user.id,
    targetUserId,
  )
  const unreadCount = await getConversationUnreadCount(
    conversation,
    user.id,
    repository,
  )

  return {
    conversation: toConversationDto(conversation, user.id, unreadCount),
  }
}

const listMessages = async (
  user,
  params,
  { repository = messagesRepository } = {},
) => {
  const conversationId = parsePositiveInteger(
    params.conversationId,
    'conversationId',
  )
  const conversation = await getConversationOrThrow(conversationId, repository)

  if (!isConversationParticipant(conversation, user.id)) {
    throw new NotFoundException('Conversation not found')
  }

  await repository.markConversationReadForUser(conversation, user.id)
  const messages = await repository.listMessagesForConversation(
    conversationId,
    MESSAGE_HISTORY_LIMIT,
  )
  const refreshedConversation =
    (await repository.findConversationById(conversationId)) || conversation

  return {
    conversation: toConversationDto(refreshedConversation, user.id, 0),
    messages: messages.reverse().map(toMessageDto),
  }
}

const createMessageInConversation = async (
  user,
  conversation,
  message,
  {
    friendshipRepository = friendsRepository,
    repository = messagesRepository,
  } = {},
) => {
  const recipientId = getOtherUserIdFromConversation(conversation, user.id)
  if (!recipientId) throw new NotFoundException('Conversation not found')

  await assertAcceptedFriends(user.id, recipientId, {
    repository: friendshipRepository,
  })

  const normalizedMessage = validateMessage(message)
  const runInTransaction = repository.withTransaction
    ? repository.withTransaction
    : async (callback) => await callback()

  return runInTransaction(async (tx) => {
    const savedMessage = await repository.createMessage(
      {
        conversationId: conversation.id,
        message: normalizedMessage,
        senderId: user.id,
      },
      tx,
    )

    await repository.markConversationReadForUser(
      conversation,
      user.id,
      savedMessage.createdAt,
      tx,
    )

    await notificationsService.createDirectMessageNotification(
      {
        actorId: user.id,
        conversationId: conversation.id,
        directMessageId: savedMessage.id,
        message: normalizedMessage,
        userId: recipientId,
      },
      { db: tx },
    )

    return {
      message: toMessageDto(savedMessage),
      recipientId,
    }
  })
}

const sendMessage = async (user, params, payload, deps = {}) => {
  const conversationId = parsePositiveInteger(
    params.conversationId,
    'conversationId',
  )
  const repository = deps.repository || messagesRepository
  const conversation = await getConversationOrThrow(conversationId, repository)
  const result = await createMessageInConversation(
    user,
    conversation,
    payload?.message,
    deps,
  )

  return { message: result.message }
}

const sendMessageToRecipient = async (
  user,
  { message, recipientId },
  deps = {},
) => {
  const repository = deps.repository || messagesRepository
  await assertAcceptedFriends(user.id, recipientId, {
    repository: deps.friendshipRepository || friendsRepository,
  })

  const conversation = await repository.findOrCreateConversationForUsers(
    user.id,
    recipientId,
  )
  const result = await createMessageInConversation(
    user,
    conversation,
    message,
    deps,
  )

  return {
    ...result.message,
    recipientId: result.recipientId,
  }
}

const createConversationFromAcceptedRequest = async (
  relationship,
  { repository = messagesRepository, db } = {},
) => {
  const conversation = await repository.findOrCreateConversationForUsers(
    relationship.requesterId,
    relationship.addresseeId,
    db,
  )
  const introMessage = getTrimmedString(relationship.requestMessage)

  if (!introMessage) return conversation

  if (relationship.id && repository.findMessageByFriendshipRequestId) {
    const existingIntroMessage =
      await repository.findMessageByFriendshipRequestId(relationship.id, db)
    if (existingIntroMessage) return conversation
  }

  const savedMessage = await repository.createMessage(
    {
      conversationId: conversation.id,
      friendshipRequestId: relationship.id || undefined,
      message: introMessage,
      senderId: relationship.requesterId,
    },
    db,
  )

  await repository.markConversationReadForUser(
    conversation,
    relationship.requesterId,
    savedMessage.createdAt,
    db,
  )

  await notificationsService.createDirectMessageNotification(
    {
      actorId: relationship.requesterId,
      conversationId: conversation.id,
      directMessageId: savedMessage.id,
      message: introMessage,
      userId: relationship.addresseeId,
    },
    { db },
  )

  return conversation
}

module.exports = {
  DIRECT_MESSAGE_MAX_LENGTH,
  assertAcceptedFriends,
  createConversationFromAcceptedRequest,
  getOrCreateConversation,
  listConversations,
  listMessages,
  markAllConversationsRead,
  sendMessage,
  sendMessageToRecipient,
  toConversationDto,
  toMessageDto,
  validateMessage,
}
