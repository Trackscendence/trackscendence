import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import useSocialNotificationStore from './useSocialNotificationStore.js'
import { resetSessionStores } from './createSessionStore.js'
import { setStoredToken } from '../services/tokenStorage.js'

// node has no localStorage, so back tokenStorage with an in-memory shim (#391).
const storage = new Map()
globalThis.localStorage = globalThis.localStorage || {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}

const notification = {
  id: 15,
  type: 'DIRECT_MESSAGE',
  message: 'a private message snippet',
  isRead: false,
  createdAt: '2026-07-09T12:00:00.000Z',
  actor: { id: 2, username: 'friend', displayName: 'Friend', avatarUrl: null },
}

beforeEach(() => {
  setStoredToken('session-token')
  useSocialNotificationStore.getState().reset()
})

test('session teardown clears notification data back to defaults', () => {
  useSocialNotificationStore.setState({
    notifications: [notification],
    unreadCount: 4,
  })

  resetSessionStores()

  const state = useSocialNotificationStore.getState()
  assert.deepEqual(state.notifications, [])
  assert.equal(state.unreadCount, 0)
})

test('reset returns fresh default objects, not shared references', () => {
  useSocialNotificationStore.setState({ notifications: [notification] })
  resetSessionStores()

  const firstNotifications = useSocialNotificationStore.getState().notifications
  useSocialNotificationStore.setState({ notifications: [notification] })
  resetSessionStores()

  assert.notEqual(
    useSocialNotificationStore.getState().notifications,
    firstNotifications,
  )
  assert.deepEqual(useSocialNotificationStore.getState().notifications, [])
})

test('markFriendRequestHandled drops the inline actions for that actor only', () => {
  useSocialNotificationStore.setState({
    notifications: [
      {
        ...notification,
        id: 1,
        friendRequestStatus: 'PENDING',
        type: 'FRIEND_REQUEST',
      },
      {
        ...notification,
        id: 2,
        actor: { ...notification.actor, id: 9, username: 'other' },
        friendRequestStatus: 'PENDING',
        type: 'FRIEND_REQUEST',
      },
      { ...notification, id: 3, type: 'DIRECT_MESSAGE' },
    ],
  })

  useSocialNotificationStore.getState().markFriendRequestHandled(2)

  const state = useSocialNotificationStore.getState()
  assert.equal(state.notifications[0].friendRequestStatus, null)
  assert.equal(state.notifications[1].friendRequestStatus, 'PENDING')
  assert.equal(state.notifications[2].type, 'DIRECT_MESSAGE')
})

test('an accepted intro request carries its conversation into the cache', () => {
  useSocialNotificationStore.setState({
    notifications: [
      {
        ...notification,
        id: 1,
        conversationId: null,
        friendRequestStatus: 'PENDING',
        type: 'FRIEND_REQUEST',
      },
      {
        ...notification,
        id: 2,
        conversationId: null,
        friendRequestStatus: 'PENDING',
        message: null,
        type: 'FRIEND_REQUEST',
      },
    ],
  })

  useSocialNotificationStore.getState().markFriendRequestHandled(2, 48)

  const state = useSocialNotificationStore.getState()
  // The intro-message row routes to its chat; the plain row keeps profile
  // routing (no conversation attached).
  assert.equal(state.notifications[0].conversationId, 48)
  assert.equal(state.notifications[1].conversationId, null)
})
