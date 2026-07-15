const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const friendsService = require('./friends.service')
const friendsRepository = require('./friends.repository')
const messagesService = require('#modules/messages/messages.service')
const notificationsService = require('#modules/notifications/notifications.service')
const notificationsSocket = require('#modules/notifications/notifications.socket')

const now = new Date('2026-07-09T12:00:00.000Z')

const withStubs = async (stubs, body) => {
  const originals = stubs.map(([object, key]) => [object, key, object[key]])
  stubs.forEach(([object, key, fn]) => {
    object[key] = fn
  })

  try {
    await body()
  } finally {
    originals.forEach(([object, key, fn]) => {
      object[key] = fn
    })
  }
}

describe('friendsService.validateRequestMessage', () => {
  it('trims optional friend-request intro messages', () => {
    assert.equal(friendsService.validateRequestMessage(' hello '), 'hello')
    assert.equal(friendsService.validateRequestMessage('   '), null)
  })

  it('caps friend-request intro messages', () => {
    assert.throws(
      () => friendsService.validateRequestMessage('x'.repeat(501)),
      (error) =>
        error.payload?.details?.[0] ===
        'message must be at most 500 characters',
    )
  })
})

describe('friendsService.toIncomingRequestSummary', () => {
  it('includes the friend-request preview message', () => {
    const summary = friendsService.toIncomingRequestSummary({
      createdAt: now,
      requestMessage: 'hello before we chat',
      requester: {
        id: 1,
        username: 'sender',
        displayName: null,
        avatarUrl: null,
      },
    })

    assert.equal(summary.message, 'hello before we chat')
  })
})

describe('friendsService notification invalidation', () => {
  it('emits a notification refresh for the recipient when sending a friend request', async () => {
    const emissions = []

    await withStubs(
      [
        [
          friendsRepository,
          'findPublicUserById',
          async () => ({
            id: 2,
            username: 'friend',
            displayName: null,
            avatarUrl: null,
          }),
        ],
        [friendsRepository, 'findRelationshipBetweenUsers', async () => null],
        [
          friendsRepository,
          'createFriendRequest',
          async () => ({
            id: 11,
            requesterId: 1,
            addresseeId: 2,
            requestMessage: 'hello',
            status: 'PENDING',
            createdAt: now,
            requester: {
              id: 1,
              username: 'sender',
              displayName: null,
              avatarUrl: null,
            },
            addressee: {
              id: 2,
              username: 'friend',
              displayName: null,
              avatarUrl: null,
            },
          }),
        ],
        [
          notificationsService,
          'createFriendRequestNotification',
          async () => null,
        ],
        [
          notificationsSocket,
          'emitSocialNotificationsChanged',
          (userId) => {
            emissions.push(userId)
          },
        ],
      ],
      async () => {
        await friendsService.sendFriendRequest(
          { id: 1, username: 'sender' },
          { message: ' hello ', targetUserId: 2 },
        )
      },
    )

    assert.deepEqual(emissions, [2])
  })

  it('emits refreshes for both users when a friend request is accepted', async () => {
    const emissions = []
    const relationship = {
      id: 22,
      requesterId: 1,
      addresseeId: 2,
      requestMessage: null,
      status: 'PENDING',
      createdAt: now,
      requester: {
        id: 1,
        username: 'sender',
        displayName: null,
        avatarUrl: null,
      },
      addressee: {
        id: 2,
        username: 'friend',
        displayName: null,
        avatarUrl: null,
      },
    }

    await withStubs(
      [
        [
          friendsRepository,
          'findRelationshipBetweenUsers',
          async () => relationship,
        ],
        [
          friendsRepository,
          'withLockedFriendshipById',
          async (_id, callback) => callback(relationship, 'tx'),
        ],
        [
          friendsRepository,
          'acceptFriendRequestById',
          async () => ({
            ...relationship,
            status: 'ACCEPTED',
          }),
        ],
        [
          notificationsService,
          'createFriendAcceptedNotification',
          async () => null,
        ],
        [
          messagesService,
          'createConversationFromAcceptedRequest',
          async () => ({ id: 88 }),
        ],
        [
          notificationsSocket,
          'emitSocialNotificationsChanged',
          (userId) => {
            emissions.push(userId)
          },
        ],
      ],
      async () => {
        await friendsService.respondToFriendRequest(
          { id: 2, username: 'friend' },
          { action: 'accept', targetUserId: 1 },
        )
      },
    )

    assert.deepEqual(
      [...new Set(emissions)].sort((a, b) => a - b),
      [1, 2],
    )
  })

  it('emits a refresh for the responder when a friend request is rejected', async () => {
    const emissions = []
    const relationship = {
      id: 23,
      requesterId: 1,
      addresseeId: 2,
      requestMessage: null,
      status: 'PENDING',
      createdAt: now,
      requester: {
        id: 1,
        username: 'sender',
        displayName: null,
        avatarUrl: null,
      },
      addressee: {
        id: 2,
        username: 'friend',
        displayName: null,
        avatarUrl: null,
      },
    }

    await withStubs(
      [
        [
          friendsRepository,
          'findRelationshipBetweenUsers',
          async () => relationship,
        ],
        [
          friendsRepository,
          'withLockedFriendshipById',
          async (_id, callback) => callback(relationship, 'tx'),
        ],
        [friendsRepository, 'deleteFriendshipById', async () => relationship],
        [
          notificationsSocket,
          'emitSocialNotificationsChanged',
          (userId) => {
            emissions.push(userId)
          },
        ],
      ],
      async () => {
        await friendsService.respondToFriendRequest(
          { id: 2, username: 'friend' },
          { action: 'reject', targetUserId: 1 },
        )
      },
    )

    assert.deepEqual(emissions, [2])
  })
})
