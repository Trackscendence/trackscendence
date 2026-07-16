const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const ForbiddenException = require('#exceptions/forbidden.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const friendsRepository = require('#modules/friends/friends.repository')
const messagesService = require('#modules/messages/messages.service')
const notificationsService = require('#modules/notifications/notifications.service')
const { BLOCK_STATE } = require('#modules/friends/friendBlockState')
const notificationsSocket = require('#modules/notifications/notifications.socket')

const FRIENDSHIP_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  BLOCKED: 'BLOCKED',
}

// A block only makes sense between current friends, so a block moves the
// friendship ACCEPTED -> BLOCKED and an unblock moves it back. These resolvers
// hold the state machine (and its no-op / conflict cases) as pure functions so
// the transitions can be tested without a database.
const BLOCK_DECISION = {
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  NOOP: 'noop',
}

const resolveBlockAction = (relationship, currentUserId) => {
  if (!relationship) {
    throw new NotFoundException(
      'You can only block someone you are friends with',
    )
  }

  if (relationship.status === FRIENDSHIP_STATUS.BLOCKED) {
    // Already blocked by me: nothing to do. Blocked by them: not mine to change.
    if (relationship.blockedById === currentUserId) return BLOCK_DECISION.NOOP
    throw new ForbiddenException('You cannot block this user')
  }

  if (relationship.status !== FRIENDSHIP_STATUS.ACCEPTED) {
    throw new BadRequestException(
      'You can only block someone you are friends with',
    )
  }

  return BLOCK_DECISION.BLOCK
}

const resolveUnblockAction = (relationship, currentUserId) => {
  if (!relationship) {
    throw new NotFoundException('Friendship not found')
  }

  // Nothing is blocked, so unblocking is a no-op rather than an error.
  if (relationship.status !== FRIENDSHIP_STATUS.BLOCKED) {
    return BLOCK_DECISION.NOOP
  }

  if (relationship.blockedById !== currentUserId) {
    throw new ForbiddenException('Only the person who blocked can unblock')
  }

  return BLOCK_DECISION.UNBLOCK
}

const FRIEND_RESPONSE_ACTION = {
  ACCEPT: 'accept',
  REJECT: 'reject',
}

const PRISMA_INT_MAX = 2147483647
const FRIEND_REQUEST_MESSAGE_MAX_LENGTH = 500

const DELETE_RELATIONSHIP_ACTION = {
  REMOVE_ACCEPTED: 'removeAccepted',
  CANCEL_PENDING: 'cancelPending',
}

const isUniqueConstraintError = (error) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

const isForeignKeyConstraintError = (error) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  )
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

const getTrimmedString = (value) => {
  return typeof value === 'string' ? value.trim() : ''
}

const validateRequestMessage = (message) => {
  const normalizedMessage = getTrimmedString(message)

  if (!normalizedMessage) return null

  if (normalizedMessage.length > FRIEND_REQUEST_MESSAGE_MAX_LENGTH) {
    throw new BadRequestException('Invalid request data', {
      details: [
        `message must be at most ${FRIEND_REQUEST_MESSAGE_MAX_LENGTH} characters`,
      ],
    })
  }

  return normalizedMessage
}

const validateFriendRequestInput = ({ message, targetUserId } = {}) => {
  return {
    targetUserId: parsePositiveInteger(targetUserId, 'targetUserId'),
    requestMessage: validateRequestMessage(message),
  }
}

const validateFriendResponseInput = ({ targetUserId, action } = {}) => {
  const normalizedAction =
    typeof action === 'string' ? action.trim().toLowerCase() : ''

  if (
    normalizedAction !== FRIEND_RESPONSE_ACTION.ACCEPT &&
    normalizedAction !== FRIEND_RESPONSE_ACTION.REJECT
  ) {
    throw new BadRequestException('Invalid request data', {
      details: ['action must be either accept or reject'],
    })
  }

  return {
    targetUserId: parsePositiveInteger(targetUserId, 'targetUserId'),
    action: normalizedAction,
  }
}

const validateTargetUserIdParam = (params = {}) => {
  return parsePositiveInteger(params.targetUserId, 'targetUserId')
}

const toFriendUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
})

const getFriendUserFromRelationship = (relationship, currentUserId) => {
  return relationship.requesterId === currentUserId
    ? relationship.addressee
    : relationship.requester
}

const toFriendSummary = (relationship, currentUserId) => {
  const friend = getFriendUserFromRelationship(relationship, currentUserId)

  return {
    user: toFriendUser(friend),
    friendSince: relationship.updatedAt,
  }
}

const toIncomingRequestSummary = (relationship) => ({
  user: toFriendUser(relationship.requester),
  message: relationship.requestMessage,
  requestedAt: relationship.createdAt,
})

const toOutgoingRequestSummary = (relationship) => ({
  user: toFriendUser(relationship.addressee),
  message: relationship.requestMessage,
  requestedAt: relationship.createdAt,
})

const assertIncomingPendingRelationship = (
  relationship,
  currentUserId,
  targetUserId,
) => {
  if (!relationship || relationship.status !== FRIENDSHIP_STATUS.PENDING) {
    throw new NotFoundException('Pending friend request not found')
  }

  if (relationship.addresseeId !== currentUserId) {
    if (relationship.requesterId === currentUserId) {
      throw new BadRequestException(
        'You can only respond to incoming friend requests',
      )
    }

    throw new ForbiddenException(
      'You are not allowed to respond to this request',
    )
  }

  if (relationship.requesterId !== targetUserId) {
    throw new NotFoundException('Pending friend request not found')
  }
}

const getDeleteRelationshipAction = (relationship, currentUserId) => {
  if (!relationship) {
    throw new NotFoundException('Friendship not found')
  }

  if (relationship.status === FRIENDSHIP_STATUS.ACCEPTED) {
    return DELETE_RELATIONSHIP_ACTION.REMOVE_ACCEPTED
  }

  if (relationship.status === FRIENDSHIP_STATUS.PENDING) {
    if (relationship.requesterId !== currentUserId) {
      throw new BadRequestException(
        'Incoming friend requests must be handled through the respond endpoint',
      )
    }

    return DELETE_RELATIONSHIP_ACTION.CANCEL_PENDING
  }

  throw new ForbiddenException(
    'Blocked relationships cannot be removed through this endpoint',
  )
}

const assertDeleteRelationshipActionStillValid = (
  relationship,
  currentUserId,
  expectedAction,
) => {
  if (!relationship) {
    throw new NotFoundException('Friendship not found')
  }

  if (expectedAction === DELETE_RELATIONSHIP_ACTION.REMOVE_ACCEPTED) {
    if (relationship.status !== FRIENDSHIP_STATUS.ACCEPTED) {
      throw new ConflictException('Friendship state changed. Please retry')
    }

    return
  }

  if (
    relationship.status !== FRIENDSHIP_STATUS.PENDING ||
    relationship.requesterId !== currentUserId
  ) {
    throw new ConflictException('Friend request is no longer pending')
  }
}

const throwRelationshipConflict = (relationship, currentUserId) => {
  if (relationship.status === FRIENDSHIP_STATUS.PENDING) {
    if (relationship.requesterId === currentUserId) {
      throw new ConflictException('Friend request already sent')
    }

    throw new ConflictException(
      'This user has already sent you a friend request',
    )
  }

  if (relationship.status === FRIENDSHIP_STATUS.ACCEPTED) {
    throw new ConflictException('You are already friends with this user')
  }

  throw new ForbiddenException(
    'Friend request is not allowed for this relationship',
  )
}

const sendFriendRequest = async (user, payload) => {
  const { requestMessage, targetUserId } = validateFriendRequestInput(payload)

  if (targetUserId === user.id) {
    throw new BadRequestException(
      'You cannot send a friend request to yourself',
    )
  }

  const targetUser = await friendsRepository.findPublicUserById(targetUserId)

  if (!targetUser) {
    throw new NotFoundException('Target user not found')
  }

  const existingRelationship =
    await friendsRepository.findRelationshipBetweenUsers(user.id, targetUserId)

  if (existingRelationship) {
    throwRelationshipConflict(existingRelationship, user.id)
  }

  try {
    const request = await friendsRepository.createFriendRequest({
      addresseeId: targetUserId,
      requestMessage,
      requesterId: user.id,
    })

    await notificationsService.createFriendRequestNotification({
      actorId: user.id,
      message: requestMessage,
      userId: targetUserId,
    })
    notificationsSocket.emitSocialNotificationsChanged(targetUserId)

    return {
      message: 'Friend request sent successfully',
      request: {
        user: toFriendUser(request.addressee),
        message: request.requestMessage,
        status: request.status,
        requestedAt: request.createdAt,
      },
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const relationship = await friendsRepository.findRelationshipBetweenUsers(
        user.id,
        targetUserId,
      )

      if (relationship) {
        throwRelationshipConflict(relationship, user.id)
      }

      throw new ConflictException('Friend request already exists')
    }

    if (isForeignKeyConstraintError(error)) {
      throw new NotFoundException('Target user not found')
    }

    throw error
  }
}

const respondToFriendRequest = async (user, payload) => {
  const { targetUserId, action } = validateFriendResponseInput(payload)
  const relationship = await friendsRepository.findRelationshipBetweenUsers(
    user.id,
    targetUserId,
  )

  assertIncomingPendingRelationship(relationship, user.id, targetUserId)

  return await friendsRepository.withLockedFriendshipById(
    relationship.id,
    async (lockedRelationship, tx) => {
      assertIncomingPendingRelationship(
        lockedRelationship,
        user.id,
        targetUserId,
      )

      if (action === FRIEND_RESPONSE_ACTION.ACCEPT) {
        const accepted = await friendsRepository.acceptFriendRequestById(
          lockedRelationship.id,
          tx,
        )
        const conversation =
          await messagesService.createConversationFromAcceptedRequest(
            accepted,
            { db: tx },
          )
        await notificationsService.createFriendAcceptedNotification(
          {
            actorId: user.id,
            userId: accepted.requesterId,
          },
          { db: tx },
        )

        // A request that came with an intro message lives on as the first
        // direct message; point the addressee's request notification at that
        // conversation so clicking it later reopens the chat (#395).
        if (accepted.requestMessage) {
          await notificationsService.attachConversationToFriendRequestNotification(
            {
              actorId: accepted.requesterId,
              conversationId: conversation.id,
              userId: user.id,
            },
            { db: tx },
          )
        }

        notificationsSocket.emitSocialNotificationsChanged(accepted.requesterId)
        notificationsSocket.emitSocialNotificationsChanged(accepted.addresseeId)

        return {
          message: 'Friend request accepted successfully',
          friendship: toFriendSummary(accepted, user.id),
          conversationId: conversation.id,
        }
      }

      await friendsRepository.deleteFriendshipById(lockedRelationship.id, tx)
      notificationsSocket.emitSocialNotificationsChanged(user.id)

      return {
        message: 'Friend request rejected successfully',
      }
    },
  )
}

const deleteRelationship = async (user, params) => {
  const targetUserId = validateTargetUserIdParam(params)

  if (targetUserId === user.id) {
    throw new BadRequestException(
      'You cannot delete a relationship with yourself',
    )
  }

  const relationship = await friendsRepository.findRelationshipBetweenUsers(
    user.id,
    targetUserId,
  )
  const action = getDeleteRelationshipAction(relationship, user.id)

  return await friendsRepository.withLockedFriendshipById(
    relationship.id,
    async (lockedRelationship, tx) => {
      assertDeleteRelationshipActionStillValid(
        lockedRelationship,
        user.id,
        action,
      )

      await friendsRepository.deleteFriendshipById(lockedRelationship.id, tx)

      if (action === DELETE_RELATIONSHIP_ACTION.REMOVE_ACCEPTED) {
        return {
          message: 'Friend removed successfully',
        }
      }

      return {
        message: 'Friend request cancelled successfully',
      }
    },
  )
}

const blockUser = async (user, params) => {
  const targetUserId = validateTargetUserIdParam(params)

  if (targetUserId === user.id) {
    throw new BadRequestException('You cannot block yourself')
  }

  const relationship = await friendsRepository.findRelationshipBetweenUsers(
    user.id,
    targetUserId,
  )
  const decision = resolveBlockAction(relationship, user.id)

  if (decision === BLOCK_DECISION.NOOP) {
    return { message: 'User blocked', blockState: BLOCK_STATE.BLOCKED_BY_ME }
  }

  return await friendsRepository.withLockedFriendshipById(
    relationship.id,
    async (lockedRelationship, tx) => {
      const lockedDecision = resolveBlockAction(lockedRelationship, user.id)

      if (lockedDecision === BLOCK_DECISION.BLOCK) {
        await friendsRepository.blockFriendshipById(
          lockedRelationship.id,
          user.id,
          tx,
        )
      }

      return { message: 'User blocked', blockState: BLOCK_STATE.BLOCKED_BY_ME }
    },
  )
}

const unblockUser = async (user, params) => {
  const targetUserId = validateTargetUserIdParam(params)

  if (targetUserId === user.id) {
    throw new BadRequestException('You cannot unblock yourself')
  }

  const relationship = await friendsRepository.findRelationshipBetweenUsers(
    user.id,
    targetUserId,
  )
  const decision = resolveUnblockAction(relationship, user.id)

  if (decision === BLOCK_DECISION.NOOP) {
    return { message: 'User unblocked', blockState: BLOCK_STATE.NONE }
  }

  return await friendsRepository.withLockedFriendshipById(
    relationship.id,
    async (lockedRelationship, tx) => {
      const lockedDecision = resolveUnblockAction(lockedRelationship, user.id)

      if (lockedDecision === BLOCK_DECISION.UNBLOCK) {
        await friendsRepository.unblockFriendshipById(lockedRelationship.id, tx)
      }

      return { message: 'User unblocked', blockState: BLOCK_STATE.NONE }
    },
  )
}

const listFriends = async (user) => {
  const friendships = await friendsRepository.listAcceptedFriendshipsForUser(
    user.id,
  )

  return {
    friends: friendships.map((friendship) =>
      toFriendSummary(friendship, user.id),
    ),
  }
}

const listFriendRequests = async (user) => {
  const [incoming, outgoing] = await Promise.all([
    friendsRepository.listPendingIncomingRequestsForUser(user.id),
    friendsRepository.listPendingOutgoingRequestsForUser(user.id),
  ])

  return {
    incoming: incoming.map(toIncomingRequestSummary),
    outgoing: outgoing.map(toOutgoingRequestSummary),
  }
}

module.exports = {
  blockUser,
  deleteRelationship,
  listFriendRequests,
  listFriends,
  resolveBlockAction,
  resolveUnblockAction,
  respondToFriendRequest,
  sendFriendRequest,
  toIncomingRequestSummary,
  unblockUser,
  validateRequestMessage,
}
