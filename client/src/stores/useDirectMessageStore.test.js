import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'
import useDirectMessageStore, {
  TYPING_STALE_TIMEOUT_MS,
  resetMessagesServiceLoaderForTests,
  setMessagesServiceLoaderForTests,
} from './useDirectMessageStore.js'
import { resetSessionStores } from './createSessionStore.js'
import { setStoredToken, clearStoredToken } from '../services/tokenStorage.js'

// node has no localStorage, so back tokenStorage with an in-memory shim. The
// store's socket handler and async writes are token-guarded (#391), so tests
// run against a signed-in session unless they clear it on purpose.
const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}

beforeEach(() => {
  setStoredToken('session-token')
  useDirectMessageStore.getState().reset()
})

afterEach(() => {
  resetMessagesServiceLoaderForTests()
})

const waitForAsyncReadMark = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0)
  })

const stubReadService = ({ error, readAt } = {}) => {
  const calls = []
  setMessagesServiceLoaderForTests(() => ({
    markConversationRead: async (conversationId, token) => {
      calls.push({ conversationId, token })
      if (error) throw error
      return { readAt }
    },
  }))
  return calls
}

const conversation = {
  id: 7,
  friend: {
    id: 2,
    username: 'friend',
    displayName: 'Friend',
    avatarUrl: null,
  },
  unreadCount: 2,
  updatedAt: '2026-07-09T11:00:00.000Z',
  createdAt: '2026-07-09T10:00:00.000Z',
}

test('incoming direct messages increment unread count for inactive conversations', () => {
  useDirectMessageStore.getState().reset()
  useDirectMessageStore.setState({ conversations: [conversation] })

  useDirectMessageStore.getState().receiveMessage(
    {
      id: 1,
      conversationId: 7,
      senderId: 2,
      message: 'hello',
      createdAt: '2026-07-09T12:00:00.000Z',
      user: conversation.friend,
    },
    1,
  )

  const state = useDirectMessageStore.getState()
  assert.equal(state.conversations[0].unreadCount, 3)
  assert.equal(state.unreadCount, 3)
})

test('active direct conversations do not gain unread count', async () => {
  const calls = stubReadService({
    readAt: '2026-07-09T12:01:30.000Z',
  })

  useDirectMessageStore.getState().reset()
  useDirectMessageStore.setState({
    activeConversationId: 7,
    conversations: [conversation],
  })

  useDirectMessageStore.getState().receiveMessage(
    {
      id: 2,
      conversationId: 7,
      senderId: 2,
      message: 'active hello',
      createdAt: '2026-07-09T12:01:00.000Z',
      user: conversation.friend,
    },
    1,
  )

  const state = useDirectMessageStore.getState()
  assert.equal(state.conversations[0].unreadCount, 2)
  assert.equal(state.messagesByConversation[7][0].message, 'active hello')

  await waitForAsyncReadMark()

  assert.deepEqual(calls, [{ conversationId: 7, token: 'session-token' }])
})

test('direct-message typing state clears when stop-typing arrives', () => {
  useDirectMessageStore.getState().receiveTyping({ conversationId: 7 })

  assert.ok(useDirectMessageStore.getState().typingByConversation[7])

  useDirectMessageStore.getState().receiveStopTyping({ conversationId: 7 })

  assert.deepEqual(useDirectMessageStore.getState().typingByConversation, {})
})

test('direct-message typing state self-clears after the stale timeout', (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 })

  useDirectMessageStore.getState().receiveTyping({ conversationId: 7 })
  t.mock.timers.tick(TYPING_STALE_TIMEOUT_MS - 1)

  assert.ok(useDirectMessageStore.getState().typingByConversation[7])

  t.mock.timers.tick(1)

  assert.deepEqual(useDirectMessageStore.getState().typingByConversation, {})
})

test('receiving a direct message clears the typing indicator for that conversation', () => {
  useDirectMessageStore.getState().receiveTyping({ conversationId: 7 })

  useDirectMessageStore.getState().receiveMessage(
    {
      id: 4,
      conversationId: 7,
      senderId: 2,
      message: 'sent while typing',
      createdAt: '2026-07-09T12:02:30.000Z',
      user: conversation.friend,
    },
    1,
  )

  assert.deepEqual(useDirectMessageStore.getState().typingByConversation, {})
})

test('duplicate direct-message socket echoes are ignored', () => {
  useDirectMessageStore.getState().reset()

  const message = {
    id: 3,
    conversationId: 7,
    senderId: 1,
    message: 'echo',
    createdAt: '2026-07-09T12:02:00.000Z',
    user: { id: 1, username: 'sender' },
  }

  useDirectMessageStore.getState().receiveMessage(message, 1)
  useDirectMessageStore.getState().receiveMessage(message, 1)

  assert.equal(
    useDirectMessageStore.getState().messagesByConversation[7].length,
    1,
  )
})

test('incoming messages on the open thread post a read cursor', async () => {
  const calls = stubReadService({
    readAt: '2026-07-09T12:08:00.000Z',
  })

  useDirectMessageStore.setState({
    activeConversationId: 7,
    conversations: [conversation],
  })

  useDirectMessageStore.getState().receiveMessage(
    {
      id: 4,
      conversationId: 7,
      senderId: 2,
      message: 'seen live',
      createdAt: '2026-07-09T12:06:00.000Z',
      user: conversation.friend,
    },
    1,
  )

  assert.equal(
    useDirectMessageStore.getState().conversations[0].lastReadAt,
    '2026-07-09T12:06:00.000Z',
  )

  await waitForAsyncReadMark()

  assert.deepEqual(calls, [{ conversationId: 7, token: 'session-token' }])
  assert.equal(
    useDirectMessageStore.getState().conversations[0].lastReadAt,
    '2026-07-09T12:08:00.000Z',
  )
})

test('incoming messages on a background conversation leave my cursor alone', async () => {
  const calls = stubReadService({
    readAt: '2026-07-09T12:08:00.000Z',
  })

  useDirectMessageStore.setState({
    activeConversationId: null,
    conversations: [conversation],
  })

  useDirectMessageStore.getState().receiveMessage(
    {
      id: 5,
      conversationId: 7,
      senderId: 2,
      message: 'not seen yet',
      createdAt: '2026-07-09T12:07:00.000Z',
      user: conversation.friend,
    },
    1,
  )

  assert.equal(
    useDirectMessageStore.getState().conversations[0].lastReadAt,
    undefined,
  )

  await waitForAsyncReadMark()

  assert.deepEqual(calls, [])
})

test('older read endpoint responses do not move my cursor backward', async () => {
  const calls = stubReadService({
    readAt: '2026-07-09T12:05:00.000Z',
  })

  useDirectMessageStore.setState({
    conversations: [conversation],
  })

  await useDirectMessageStore
    .getState()
    .markConversationRead(7, '2026-07-09T12:06:00.000Z')

  assert.deepEqual(calls, [{ conversationId: 7, token: 'session-token' }])
  assert.equal(
    useDirectMessageStore.getState().conversations[0].lastReadAt,
    '2026-07-09T12:06:00.000Z',
  )
})

test('failed read endpoint calls keep the optimistic cursor', async () => {
  const calls = stubReadService({
    error: new Error('network down'),
  })

  useDirectMessageStore.setState({
    conversations: [conversation],
  })

  await useDirectMessageStore
    .getState()
    .markConversationRead(7, '2026-07-09T12:06:00.000Z')

  assert.deepEqual(calls, [{ conversationId: 7, token: 'session-token' }])
  assert.equal(
    useDirectMessageStore.getState().conversations[0].lastReadAt,
    '2026-07-09T12:06:00.000Z',
  )
})

test("read events update a non-open conversation's friend cursor", () => {
  useDirectMessageStore.setState({
    activeConversationId: null,
    conversations: [conversation],
  })

  useDirectMessageStore.getState().markConversationReadByFriend({
    conversationId: 7,
    readAt: '2026-07-09T12:04:00.000Z',
  })

  assert.equal(
    useDirectMessageStore.getState().conversations[0].friendLastReadAt,
    '2026-07-09T12:04:00.000Z',
  )
})

test('older read events do not move the friend cursor backward', () => {
  useDirectMessageStore.setState({
    conversations: [
      {
        ...conversation,
        friendLastReadAt: '2026-07-09T12:05:00.000Z',
      },
    ],
  })

  useDirectMessageStore.getState().markConversationReadByFriend({
    conversationId: 7,
    readAt: '2026-07-09T12:04:00.000Z',
  })

  assert.equal(
    useDirectMessageStore.getState().conversations[0].friendLastReadAt,
    '2026-07-09T12:05:00.000Z',
  )
})

test('session teardown clears direct-message data back to defaults', () => {
  useDirectMessageStore.setState({
    activeConversationId: 7,
    conversations: [conversation],
    messagesByConversation: { 7: [{ id: 1, message: 'private' }] },
    typingByConversation: { 7: { receivedAt: 0 } },
    unreadCount: 2,
  })

  resetSessionStores()

  const state = useDirectMessageStore.getState()
  assert.equal(state.activeConversationId, null)
  assert.deepEqual(state.conversations, [])
  assert.deepEqual(state.messagesByConversation, {})
  assert.deepEqual(state.typingByConversation, {})
  assert.equal(state.unreadCount, 0)
})

test('socket messages are dropped once the session has ended', () => {
  clearStoredToken()

  useDirectMessageStore.getState().receiveMessage(
    {
      id: 9,
      conversationId: 7,
      senderId: 2,
      message: 'late event after logout',
      createdAt: '2026-07-09T12:03:00.000Z',
      user: conversation.friend,
    },
    1,
  )

  const state = useDirectMessageStore.getState()
  assert.deepEqual(state.conversations, [])
  assert.deepEqual(state.messagesByConversation, {})
})
