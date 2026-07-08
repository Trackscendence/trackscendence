import assert from 'node:assert/strict'
import test from 'node:test'
import useDirectMessageStore from './useDirectMessageStore.js'

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
