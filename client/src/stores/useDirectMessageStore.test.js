import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import useDirectMessageStore from './useDirectMessageStore.js'
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

test('active direct conversations do not gain unread count', () => {
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

test('incoming messages on the open thread advance my own read cursor', () => {
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
})

test('incoming messages on a background conversation leave my cursor alone', () => {
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
    unreadCount: 2,
  })

  resetSessionStores()

  const state = useDirectMessageStore.getState()
  assert.equal(state.activeConversationId, null)
  assert.deepEqual(state.conversations, [])
  assert.deepEqual(state.messagesByConversation, {})
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
