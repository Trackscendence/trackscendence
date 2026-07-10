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
