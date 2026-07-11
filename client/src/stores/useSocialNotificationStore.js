import { getStoredToken } from '../services/tokenStorage.js'
import { createSessionStore } from './createSessionStore.js'
import { isActiveToken } from './sessionGuard.js'
import useDirectMessageStore from './useDirectMessageStore.js'
import useNotificationStore from './useNotificationStore.js'

const getDefaultState = () => ({
  error: '',
  isLoading: false,
  isSubmitting: false,
  notifications: [],
  unreadCount: 0,
})

const getActiveToken = () => getStoredToken()

const requireToken = () => {
  const token = getActiveToken()
  if (!token) throw new Error('Authentication required')
  return token
}

// Services load lazily so this module stays importable under node --test,
// which cannot resolve the @/ alias at the top level.
const getNotificationsService = () => import('@/services/notifications')
const getFriendsService = () => import('@/services/friends')

// Session store (#391): holds notification text (including message snippets),
// so it is cleared by resetSessionStores() at teardown and every post-await
// write is guarded against a session that ended or changed mid-flight.
const useSocialNotificationStore = createSessionStore((set) => ({
  ...getDefaultState(),

  loadNotifications: async () => {
    const token = getActiveToken()
    if (!token) return

    set({ error: '', isLoading: true })

    try {
      const { getNotifications } = await getNotificationsService()
      const result = await getNotifications(token)
      if (!isActiveToken(token)) return
      set({
        isLoading: false,
        notifications: result.notifications || [],
        unreadCount: result.unreadCount || 0,
      })
    } catch (error) {
      if (!isActiveToken(token)) return
      set({ error: error.message, isLoading: false })
    }
  },

  markRead: async (notificationId) => {
    const token = getActiveToken()
    if (!token) return

    try {
      const { markNotificationRead } = await getNotificationsService()
      const result = await markNotificationRead(notificationId, token)
      if (!isActiveToken(token)) return
      set({
        notifications: result.notifications || [],
        unreadCount: result.unreadCount || 0,
      })
    } catch {
      // The dropdown remains usable if marking read fails.
    }
  },

  markAllRead: async () => {
    const token = getActiveToken()
    if (!token) return

    try {
      const { markAllNotificationsRead } = await getNotificationsService()
      const result = await markAllNotificationsRead(token)
      if (!isActiveToken(token)) return
      set({
        notifications: result.notifications || [],
        unreadCount: result.unreadCount || 0,
      })
    } catch {
      // The dropdown remains usable if marking read fails.
    }
  },

  acceptFriendRequest: async (targetUserId) => {
    const notifications = useNotificationStore.getState()

    set({ error: '', isSubmitting: true })

    let token = null
    try {
      token = requireToken()
      const { respondToFriendRequest } = await getFriendsService()
      const result = await respondToFriendRequest(
        { action: 'accept', targetUserId },
        token,
      )
      if (!isActiveToken(token)) return null
      await useSocialNotificationStore.getState().loadNotifications()
      await useDirectMessageStore.getState().loadConversations()
      if (!isActiveToken(token)) return null
      // No success toast here: panel responses are bulk work, and the list
      // updating (the request disappears) is the feedback. Failures still toast.
      set({ isSubmitting: false })
      return result
    } catch (error) {
      // A missing token (null) still surfaces; a stale session stays silent.
      if (token && !isActiveToken(token)) return null
      set({ error: error.message, isSubmitting: false })
      notifications.push(error.message, 'error')
      return null
    }
  },

  // Synchronous patch for a request answered somewhere else (the profile's
  // Accept/Reject): the cached notification drops its inline actions the
  // moment the backend confirms, so the bell can never briefly offer a
  // response that was already given. A background reload restores full truth.
  markFriendRequestHandled: (actorId) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.type === 'FRIEND_REQUEST' &&
        notification.actor?.id === actorId
          ? { ...notification, friendRequestStatus: null }
          : notification,
      ),
    })),

  rejectFriendRequest: async (targetUserId) => {
    const notifications = useNotificationStore.getState()

    set({ error: '', isSubmitting: true })

    let token = null
    try {
      token = requireToken()
      const { respondToFriendRequest } = await getFriendsService()
      const result = await respondToFriendRequest(
        { action: 'reject', targetUserId },
        token,
      )
      if (!isActiveToken(token)) return null
      await useSocialNotificationStore.getState().loadNotifications()
      if (!isActiveToken(token)) return null
      set({ isSubmitting: false })
      return result
    } catch (error) {
      // A missing token (null) still surfaces; a stale session stays silent.
      if (token && !isActiveToken(token)) return null
      set({ error: error.message, isSubmitting: false })
      notifications.push(error.message, 'error')
      return null
    }
  },

  reset: () => set(getDefaultState()),
}))

export default useSocialNotificationStore
