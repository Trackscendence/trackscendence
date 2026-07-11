const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const notificationsService = require('./notifications.service')

const now = new Date('2026-07-09T12:00:00.000Z')

const actor = {
  id: 1,
  username: 'sender',
  displayName: null,
  avatarUrl: null,
}

describe('notificationsService.listNotifications', () => {
  it('includes friend request status for pending request notifications', async () => {
    const repository = {
      countUnreadNotificationsForUser: async () => 1,
      listNotificationsForUser: async () => [
        {
          id: 10,
          userId: 2,
          actorId: 1,
          type: 'FRIEND_REQUEST',
          message: 'hello',
          conversationId: null,
          directMessageId: null,
          readAt: null,
          createdAt: now,
          actor,
        },
      ],
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async (firstUserId, secondUserId) => {
        assert.equal(firstUserId, 2)
        assert.equal(secondUserId, 1)
        return { status: 'PENDING' }
      },
    }

    const result = await notificationsService.listNotifications(
      { id: 2 },
      { friendshipRepository, repository },
    )

    assert.equal(result.unreadCount, 1)
    assert.equal(result.notifications[0].friendRequestStatus, 'PENDING')
  })

  it('does not look up friendships for direct-message notifications', async () => {
    let lookupCount = 0
    const repository = {
      countUnreadNotificationsForUser: async () => 0,
      listNotificationsForUser: async () => [
        {
          id: 11,
          userId: 2,
          actorId: 1,
          type: 'DIRECT_MESSAGE',
          message: 'hello',
          conversationId: 20,
          directMessageId: 30,
          readAt: now,
          createdAt: now,
          actor,
        },
      ],
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => {
        lookupCount += 1
      },
    }

    const result = await notificationsService.listNotifications(
      { id: 2 },
      { friendshipRepository, repository },
    )

    assert.equal(lookupCount, 0)
    assert.equal(result.notifications[0].friendRequestStatus, null)
  })
})

describe('attachConversationToFriendRequestNotifications', () => {
  it('targets only the request rows between that pair (#395)', async () => {
    const calls = []
    const repository = {
      attachConversationToFriendRequests: async (payload, db) => {
        calls.push({ payload, db })
        return { count: 1 }
      },
    }

    const result =
      await notificationsService.attachConversationToFriendRequestNotifications(
        { actorId: 7, conversationId: 31, userId: 2 },
        { repository, db: 'tx' },
      )

    assert.deepEqual(calls, [
      { payload: { actorId: 7, conversationId: 31, userId: 2 }, db: 'tx' },
    ])
    assert.deepEqual(result, { count: 1 })
  })
})
