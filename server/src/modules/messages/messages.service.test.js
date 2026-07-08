const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const messagesService = require('./messages.service')

const now = new Date('2026-07-09T12:00:00.000Z')

const user = (overrides = {}) => ({
  id: 1,
  username: 'sender',
  displayName: null,
  avatarUrl: null,
  ...overrides,
})

const conversation = {
  id: 11,
  userOneId: 1,
  userTwoId: 2,
  userOneLastReadAt: null,
  userTwoLastReadAt: null,
  createdAt: now,
  updatedAt: now,
  userOne: user({ id: 1, username: 'sender' }),
  userTwo: user({ id: 2, username: 'friend' }),
  messages: [],
}

describe('messagesService.sendMessageToRecipient', () => {
  it('requires accepted friendship before creating a conversation', async () => {
    let createdConversation = false
    const repository = {
      findOrCreateConversationForUsers: async () => {
        createdConversation = true
      },
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => null,
    }

    await assert.rejects(
      () =>
        messagesService.sendMessageToRecipient(
          user(),
          { message: 'hello', recipientId: 2 },
          { friendshipRepository, repository },
        ),
      /only available between friends/,
    )
    assert.equal(createdConversation, false)
  })

  it('persists a message and returns the recipient id', async () => {
    const notifications = []
    const repository = {
      createMessage: async ({ conversationId, message, senderId }) => ({
        id: 21,
        conversationId,
        senderId,
        message,
        createdAt: now,
        sender: user({ id: senderId, username: 'sender' }),
      }),
      findOrCreateConversationForUsers: async () => conversation,
      markConversationReadForUser: async () => conversation,
      withTransaction: async (callback) =>
        callback({
          socialNotification: {
            create: async ({ data }) => {
              notifications.push(data)
              return { ...data, id: 1, actor: user(), createdAt: now }
            },
          },
        }),
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => ({ status: 'ACCEPTED' }),
    }

    const result = await messagesService.sendMessageToRecipient(
      user(),
      { message: ' hello ', recipientId: 2 },
      { friendshipRepository, repository },
    )

    assert.equal(result.id, 21)
    assert.equal(result.recipientId, 2)
    assert.equal(result.message, 'hello')
    assert.equal(notifications[0].type, 'DIRECT_MESSAGE')
    assert.equal(notifications[0].userId, 2)
  })
})

describe('messagesService.createConversationFromAcceptedRequest', () => {
  it('copies an intro message into the accepted conversation', async () => {
    let savedMessage = null
    const repository = {
      createMessage: async (data) => {
        savedMessage = data
        return {
          id: 30,
          ...data,
          createdAt: now,
          sender: user({ id: data.senderId, username: 'sender' }),
        }
      },
      findOrCreateConversationForUsers: async () => conversation,
      markConversationReadForUser: async () => conversation,
    }
    const db = {
      socialNotification: {
        create: async ({ data }) => ({
          ...data,
          id: 1,
          actor: user(),
          createdAt: now,
        }),
      },
    }

    await messagesService.createConversationFromAcceptedRequest(
      {
        id: 99,
        requesterId: 1,
        addresseeId: 2,
        requestMessage: ' first hello ',
      },
      { db, repository },
    )

    assert.deepEqual(savedMessage, {
      conversationId: 11,
      friendshipRequestId: 99,
      message: 'first hello',
      senderId: 1,
    })
  })

  it('does not copy the same intro message twice for a retried request', async () => {
    let createMessageCalls = 0
    const repository = {
      createMessage: async () => {
        createMessageCalls += 1
      },
      findMessageByFriendshipRequestId: async (friendshipRequestId) => ({
        id: 30,
        conversationId: 11,
        friendshipRequestId,
        senderId: 1,
        message: 'first hello',
        createdAt: now,
        sender: user({ id: 1, username: 'sender' }),
      }),
      findOrCreateConversationForUsers: async () => conversation,
      markConversationReadForUser: async () => conversation,
    }

    const result = await messagesService.createConversationFromAcceptedRequest(
      {
        id: 99,
        requesterId: 1,
        addresseeId: 2,
        requestMessage: 'first hello',
      },
      { repository },
    )

    assert.equal(result.id, conversation.id)
    assert.equal(createMessageCalls, 0)
  })
})
