const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const messagesService = require('./messages.service')

const now = new Date('2026-07-09T12:00:00.000Z')
const senderReadAt = new Date('2026-07-09T12:05:00.000Z')
const friendReadAt = new Date('2026-07-09T12:10:00.000Z')

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

describe('messagesService.toConversationDto', () => {
  it("exposes the friend's last-read cursor for the viewer", () => {
    const readConversation = {
      ...conversation,
      userOneLastReadAt: senderReadAt,
      userTwoLastReadAt: friendReadAt,
    }

    assert.equal(
      messagesService.toConversationDto(readConversation, 1).friendLastReadAt,
      friendReadAt,
    )
    assert.equal(
      messagesService.toConversationDto(readConversation, 2).friendLastReadAt,
      senderReadAt,
    )
  })

  it("exposes the viewer's own last-read cursor", () => {
    const readConversation = {
      ...conversation,
      userOneLastReadAt: senderReadAt,
      userTwoLastReadAt: friendReadAt,
    }

    assert.equal(
      messagesService.toConversationDto(readConversation, 1).lastReadAt,
      senderReadAt,
    )
    assert.equal(
      messagesService.toConversationDto(readConversation, 2).lastReadAt,
      friendReadAt,
    )
  })
})

describe('messagesService.markConversationRead', () => {
  it('marks the conversation read and notifies the other participant', async () => {
    let readCall = null
    const readEvents = []
    const repository = {
      findConversationById: async () => conversation,
      markConversationReadForUser: async (target, userId, readAt) => {
        readCall = { conversationId: target.id, readAt, userId }
        return target
      },
    }

    const result = await messagesService.markConversationRead(
      user(),
      { conversationId: '11' },
      { onConversationRead: (event) => readEvents.push(event), repository },
    )

    assert.ok(result.readAt instanceof Date)
    assert.equal(readCall.conversationId, 11)
    assert.equal(readCall.userId, 1)
    assert.deepEqual(readEvents, [
      { conversationId: 11, readAt: readCall.readAt, recipientId: 2 },
    ])
  })

  it('rejects a non-participant without marking anything', async () => {
    let marked = false
    const repository = {
      findConversationById: async () => conversation,
      markConversationReadForUser: async () => {
        marked = true
      },
    }

    await assert.rejects(
      () =>
        messagesService.markConversationRead(
          user({ id: 99 }),
          { conversationId: '11' },
          { repository },
        ),
      /Conversation not found/,
    )
    assert.equal(marked, false)
  })
})

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

describe('messagesService.markAllConversationsRead', () => {
  it('marks every conversation read for the user and reports zero unread', async () => {
    const readCalls = []
    const readEvents = []
    const repository = {
      listConversationsForUser: async () => [
        { ...conversation, id: 11 },
        { ...conversation, id: 12 },
      ],
      markConversationReadForUser: async (target, userId, readAt) => {
        readCalls.push({ conversationId: target.id, readAt, userId })
        return target
      },
    }

    const result = await messagesService.markAllConversationsRead(user(), {
      onConversationRead: (event) => readEvents.push(event),
      repository,
    })

    assert.equal(result.unreadCount, 0)
    assert.deepEqual(
      readCalls.map((call) => call.conversationId),
      [11, 12],
    )
    assert.ok(readCalls.every((call) => call.userId === 1))
    assert.ok(readCalls.every((call) => call.readAt instanceof Date))
    assert.deepEqual(
      readEvents.map(({ conversationId, recipientId }) => ({
        conversationId,
        recipientId,
      })),
      [
        { conversationId: 11, recipientId: 2 },
        { conversationId: 12, recipientId: 2 },
      ],
    )
    assert.ok(readEvents.every((event) => event.readAt === readCalls[0].readAt))
  })

  it('does nothing when the user has no conversations', async () => {
    let marked = false
    const repository = {
      listConversationsForUser: async () => [],
      markConversationReadForUser: async () => {
        marked = true
      },
    }

    const result = await messagesService.markAllConversationsRead(user(), {
      repository,
    })

    assert.equal(result.unreadCount, 0)
    assert.equal(marked, false)
  })
})

describe('messagesService.listMessages', () => {
  it('notifies the other participant when a conversation is read', async () => {
    let refreshedConversation = conversation
    let readCall = null
    const readEvents = []
    const repository = {
      findConversationById: async () => refreshedConversation,
      listMessagesForConversation: async () => [],
      markConversationReadForUser: async (target, userId, readAt) => {
        readCall = { conversationId: target.id, readAt, userId }
        refreshedConversation = { ...target, userOneLastReadAt: readAt }
        return refreshedConversation
      },
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => ({ status: 'ACCEPTED' }),
    }

    await messagesService.listMessages(
      user(),
      { conversationId: '11' },
      {
        friendshipRepository,
        onConversationRead: (event) => readEvents.push(event),
        repository,
      },
    )

    assert.equal(readCall.conversationId, 11)
    assert.equal(readCall.userId, 1)
    assert.ok(readCall.readAt instanceof Date)
    assert.deepEqual(readEvents, [
      {
        conversationId: 11,
        readAt: readCall.readAt,
        recipientId: 2,
      },
    ])
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

// The friend-gated messaging lifecycle (#392). Reading is participant-based on
// purpose: unfriending blocks new messages but preserves both users' access to
// the existing conversation and its history.
describe('friend-gated direct-message lifecycle (#392)', () => {
  const unfriendedRepository = {
    findRelationshipBetweenUsers: async () => null,
  }

  it('blocks sending once the users are no longer friends', async () => {
    let createdMessage = false
    const repository = {
      findConversationById: async () => conversation,
      createMessage: async () => {
        createdMessage = true
      },
    }

    await assert.rejects(
      () =>
        messagesService.sendMessage(
          user(),
          { conversationId: '11' },
          { message: 'hello again' },
          { friendshipRepository: unfriendedRepository, repository },
        ),
      /only available between friends/,
    )
    assert.equal(createdMessage, false)
  })

  it('still lets both participants read the conversation history after unfriend', async () => {
    const savedMessages = [
      {
        id: 21,
        conversationId: 11,
        senderId: 1,
        message: 'from before the unfriend',
        createdAt: now,
        sender: user({ id: 1, username: 'sender' }),
      },
    ]
    const repository = {
      findConversationById: async () => conversation,
      listMessagesForConversation: async () => [...savedMessages],
      markConversationReadForUser: async () => conversation,
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => null,
    }

    for (const participantId of [1, 2]) {
      const result = await messagesService.listMessages(
        user({ id: participantId }),
        { conversationId: '11' },
        { friendshipRepository, repository },
      )
      assert.equal(result.messages[0].message, 'from before the unfriend')
      assert.equal(result.conversation.blockState, 'none')
    }
  })

  it('still lists the conversation for a participant after unfriend', async () => {
    const repository = {
      listConversationsForUser: async () => [conversation],
      countUnreadMessagesForConversation: async () => 0,
    }
    const friendshipRepository = {
      listRelationshipsForUser: async () => [],
    }

    const result = await messagesService.listConversations(user({ id: 2 }), {
      friendshipRepository,
      repository,
    })

    assert.equal(result.conversations.length, 1)
    assert.equal(result.conversations[0].id, conversation.id)
    assert.equal(result.conversations[0].blockState, 'none')
  })

  it('reuses the same conversation with history intact after re-friending', async () => {
    let createdNewConversation = false
    const repository = {
      findPublicUserById: async (id) => user({ id, username: 'friend' }),
      findOrCreateConversationForUsers: async () => conversation,
      createConversationForUsers: async () => {
        createdNewConversation = true
        return conversation
      },
      countUnreadMessagesForConversation: async () => 0,
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => ({ status: 'ACCEPTED' }),
    }

    const result = await messagesService.getOrCreateConversation(
      user(),
      { targetUserId: 2 },
      { friendshipRepository, repository },
    )

    assert.equal(result.conversation.id, conversation.id)
    assert.equal(createdNewConversation, false)
  })

  it.todo(
    'a future delete-conversation endpoint purges history for both participants',
  )
})

// Blocking reuses the friendship BLOCKED status. Sending is refused with a
// block-aware reason, and reading stays open but carries the block state so the
// thread can show the blocked banner.
describe('blocked direct-message lifecycle', () => {
  it('refuses to send when the viewer has blocked the recipient', async () => {
    let createdMessage = false
    const repository = {
      findConversationById: async () => conversation,
      createMessage: async () => {
        createdMessage = true
      },
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => ({
        status: 'BLOCKED',
        blockedById: 1,
      }),
    }

    await assert.rejects(
      () =>
        messagesService.sendMessage(
          user(),
          { conversationId: '11' },
          { message: 'let me back in' },
          { friendshipRepository, repository },
        ),
      /Unblock this user to send messages/,
    )
    assert.equal(createdMessage, false)
  })

  it('refuses to send when the recipient has blocked the viewer', async () => {
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => ({
        status: 'BLOCKED',
        blockedById: 2,
      }),
    }

    await assert.rejects(
      () =>
        messagesService.sendMessageToRecipient(
          user(),
          { message: 'hello?', recipientId: 2 },
          { friendshipRepository, repository: {} },
        ),
      /You cannot send messages to this user/,
    )
  })

  it('reports blockedByMe on the thread the blocker opens', async () => {
    const repository = {
      findConversationById: async () => conversation,
      listMessagesForConversation: async () => [],
      markConversationReadForUser: async () => conversation,
    }
    const friendshipRepository = {
      findRelationshipBetweenUsers: async () => ({
        status: 'BLOCKED',
        blockedById: 1,
      }),
    }

    const result = await messagesService.listMessages(
      user(),
      { conversationId: '11' },
      { friendshipRepository, repository },
    )

    assert.equal(result.conversation.blockState, 'blockedByMe')
  })

  it('stamps block state onto the conversation list', async () => {
    const repository = {
      listConversationsForUser: async () => [conversation],
      countUnreadMessagesForConversation: async () => 0,
    }
    const friendshipRepository = {
      listRelationshipsForUser: async () => [
        { requesterId: 1, addresseeId: 2, status: 'BLOCKED', blockedById: 1 },
      ],
    }

    const result = await messagesService.listConversations(user(), {
      friendshipRepository,
      repository,
    })

    assert.equal(result.conversations[0].blockState, 'blockedByMe')
  })
})
