import {
  emptyFriendContext,
  getActiveToken,
  loadCurrentProfileData,
  loadFriendContext,
  loadPublicProfileData,
  requestFriendship,
  saveCurrentProfile,
} from './profileStore.helpers'
import useNotificationStore from './useNotificationStore'

const requireToken = (set) => {
  const token = getActiveToken()

  if (!token) {
    set({ error: 'Authentication required', isLoading: false })
    return null
  }

  return token
}

export const createProfileActions = (set, get) => ({
  clearActionError: () => set({ actionError: '' }),

  loadCurrentProfile: async () => {
    const token = requireToken(set)

    if (!token) return

    set({ error: '', isLoading: true })

    try {
      set({
        ...(await loadCurrentProfileData(token)),
        isLoading: false,
      })
    } catch (error) {
      set({
        currentProfile: null,
        error: error.message,
        isLoading: false,
        ...emptyFriendContext,
      })
    }
  },

  loadPublicProfile: async (username) => {
    const token = requireToken(set)

    if (!token) return

    set({ error: '', isLoading: true, publicProfile: null })

    try {
      set({
        ...(await loadPublicProfileData({ token, username })),
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error.message,
        leaderboard: [],
        isLoading: false,
        publicProfile: null,
        relationship: null,
      })
    }
  },

  refreshFriendContext: async () => {
    const token = getActiveToken()

    if (!token) return

    set(await loadFriendContext(token))
  },

  sendFriendRequest: async () => {
    const token = getActiveToken()
    const profile = get().publicProfile
    const notifications = useNotificationStore.getState()

    if (!token) {
      notifications.push('Authentication required', 'error')
      return
    }

    if (!profile) return

    set({ actionError: '', isSubmitting: true })

    try {
      set({
        ...(await requestFriendship({ profileId: profile.id, token })),
        isSubmitting: false,
      })
      notifications.push('Friend request sent', 'success')
    } catch (error) {
      notifications.push(error.message, 'error')
      set({ actionError: '', isSubmitting: false })
    }
  },

  updateCurrentProfile: async (payload) => {
    const token = getActiveToken()

    if (!token) {
      set({ actionError: 'Authentication required' })
      return null
    }

    set({ actionError: '', isSubmitting: true })

    try {
      const { currentProfile, result } = await saveCurrentProfile({
        payload,
        token,
      })

      set({
        currentProfile,
        isSubmitting: false,
      })

      return result
    } catch (error) {
      set({ actionError: error.message, isSubmitting: false })
      return null
    }
  },
})
