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

describe('attachConversationToFriendRequestNotification', () => {
  it('passes the pair and conversation through to the repository (#395)', async () => {
    const calls = []
    const repository = {
      attachConversationToLatestFriendRequest: async (payload, db) => {
        calls.push({ payload, db })
        return { id: 5 }
      },
    }

    const result =
      await notificationsService.attachConversationToFriendRequestNotification(
        { actorId: 7, conversationId: 31, userId: 2 },
        { repository, db: 'tx' },
      )

    assert.deepEqual(calls, [
      { payload: { actorId: 7, conversationId: 31, userId: 2 }, db: 'tx' },
    ])
    assert.deepEqual(result, { id: 5 })
  })
})

describe('notificationsRepository.attachConversationToLatestFriendRequest', () => {
  const notificationsRepository = require('./notifications.repository')

  it('updates only the newest intro-message request, not historical rows (#395)', async () => {
    const queries = []
    const db = {
      socialNotification: {
        findFirst: async (query) => {
          queries.push(['findFirst', query])
          // The newest of several historical request rows for this pair.
          return { id: 42 }
        },
        update: async (query) => {
          queries.push(['update', query])
          return { id: 42, conversationId: 31 }
        },
      },
    }

    const result =
      await notificationsRepository.attachConversationToLatestFriendRequest(
        { actorId: 7, conversationId: 31, userId: 2 },
        db,
      )

    const [, findQuery] = queries[0]
    assert.deepEqual(findQuery.where, {
      actorId: 7,
      message: { not: null },
      type: 'FRIEND_REQUEST',
      userId: 2,
    })
    assert.deepEqual(findQuery.orderBy, [{ createdAt: 'desc' }, { id: 'desc' }])
    const [, updateQuery] = queries[1]
    assert.deepEqual(updateQuery.where, { id: 42 })
    assert.deepEqual(updateQuery.data, { conversationId: 31 })
    assert.equal(result.id, 42)
  })

  it('does nothing when the pair has no intro-message request', async () => {
    let updated = false
    const db = {
      socialNotification: {
        findFirst: async () => null,
        update: async () => {
          updated = true
        },
      },
    }

    const result =
      await notificationsRepository.attachConversationToLatestFriendRequest(
        { actorId: 7, conversationId: 31, userId: 2 },
        db,
      )

    assert.equal(result, null)
    assert.equal(updated, false)
  })
})
