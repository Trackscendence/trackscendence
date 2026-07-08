import { create } from 'zustand'
import { respondToFriendRequest } from '@/services/friends'
import { getStoredToken } from '../services/tokenStorage.js'
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

const getNotificationsService = () => import('@/services/notifications')

const useSocialNotificationStore = create((set) => ({
  ...getDefaultState(),

  loadNotifications: async () => {
    const token = getActiveToken()
    if (!token) return

    set({ error: '', isLoading: true })

    try {
      const { getNotifications } = await getNotificationsService()
      const result = await getNotifications(token)
      set({
        isLoading: false,
        notifications: result.notifications || [],
        unreadCount: result.unreadCount || 0,
      })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  markRead: async (notificationId) => {
    const token = getActiveToken()
    if (!token) return

    try {
      const { markNotificationRead } = await getNotificationsService()
      const result = await markNotificationRead(notificationId, token)
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

    try {
      const result = await respondToFriendRequest(
        { action: 'accept', targetUserId },
        requireToken(),
      )
      await useSocialNotificationStore.getState().loadNotifications()
      await useDirectMessageStore.getState().loadConversations()
      set({ isSubmitting: false })
      notifications.push('Friend request accepted', 'success')
      return result
    } catch (error) {
      set({ error: error.message, isSubmitting: false })
      notifications.push(error.message, 'error')
      return null
    }
  },

  reset: () => set(getDefaultState()),
}))

export default useSocialNotificationStore
