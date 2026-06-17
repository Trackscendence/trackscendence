const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const ForbiddenException = require('#exceptions/forbidden.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const friendsRepository = require('#modules/friends/friends.repository')

const FRIENDSHIP_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  BLOCKED: 'BLOCKED',
}

const FRIEND_RESPONSE_ACTION = {
  ACCEPT: 'accept',
  REJECT: 'reject',
}

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

const parsePositiveInteger = (value, fieldName) => {
  const number = Number(value)

  if (!Number.isInteger(number) || number < 1) {
    throw new BadRequestException('Invalid request data', {
      details: [`${fieldName} must be a positive integer`],
    })
  }

  return number
}

const validateFriendRequestInput = ({ targetUserId } = {}) => {
  return {
    targetUserId: parsePositiveInteger(targetUserId, 'targetUserId'),
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
  requestedAt: relationship.createdAt,
})

const toOutgoingRequestSummary = (relationship) => ({
  user: toFriendUser(relationship.addressee),
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
  const { targetUserId } = validateFriendRequestInput(payload)

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
    const request = await friendsRepository.createFriendRequest(
      user.id,
      targetUserId,
    )

    return {
      message: 'Friend request sent successfully',
      request: {
        user: toFriendUser(request.addressee),
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

        return {
          message: 'Friend request accepted successfully',
          friendship: toFriendSummary(accepted, user.id),
        }
      }

      await friendsRepository.deleteFriendshipById(lockedRelationship.id, tx)

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
  deleteRelationship,
  listFriendRequests,
  listFriends,
  respondToFriendRequest,
  sendFriendRequest,
}
