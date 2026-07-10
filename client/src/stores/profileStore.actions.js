import {
  clearAvatar,
  emptyFriendContext,
  getActiveToken,
  loadCurrentProfileData,
  loadFriendContext,
  loadLeaderboardContext,
  loadPublicProfileData,
  requestFriendship,
  saveAvatar,
  saveCurrentProfile,
} from './profileStore.helpers'
import { createCurrentProfileLoader } from './profileStore.currentProfileLoader'
import { createPublicProfileLoader } from './profileStore.publicProfileLoader'
import { isActiveToken } from './sessionGuard'
import useAuthStore from './useAuthStore'
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

  // Load the leaderboard off the critical path. It only changes when games
  // finish, so a non-empty result is cached for the session and back-and-forth
  // navigation skips the expensive aggregation. Failures leave the panel empty.
  loadLeaderboard: async () => {
    if (get().leaderboard.length > 0) return

    const token = getActiveToken()

    if (!token) return

    const { leaderboard } = await loadLeaderboardContext(token)
    if (!isActiveToken(token)) return

    set({ leaderboard })
  },

  loadCurrentProfile: createCurrentProfileLoader({
    emptyFriendContext,
    get,
    getAuthUserId: () => useAuthStore.getState().user?.id,
    isTokenActive: isActiveToken,
    loadCurrentProfileData,
    requireToken,
    set,
  }),

  loadPublicProfile: createPublicProfileLoader({
    get,
    isTokenActive: isActiveToken,
    loadPublicProfileData,
    requireToken,
    set,
  }),

  refreshFriendContext: async () => {
    const token = getActiveToken()

    if (!token) return

    const friendContext = await loadFriendContext(token)
    if (!isActiveToken(token)) return

    set(friendContext)
  },

  sendFriendRequest: async (message = '') => {
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
      const friendshipContext = await requestFriendship({
        message,
        profileId: profile.id,
        token,
      })
      if (!isActiveToken(token)) return false
      set({
        ...friendshipContext,
        isSubmitting: false,
      })
      notifications.push('Friend request sent', 'success')
      return true
    } catch (error) {
      if (!isActiveToken(token)) return false
      notifications.push(error.message, 'error')
      set({ actionError: '', isSubmitting: false })
      return false
    }
  },

  // The three profile writes below (details, avatar upload, avatar remove)
  // share isSubmitting as a single-writer gate: while one is in flight the
  // others bail out, so the profile can never take two overlapping writes.
  updateCurrentProfile: async (payload) => {
    if (get().isSubmitting) return null

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
      if (!isActiveToken(token)) return null

      set({
        currentProfile,
        isSubmitting: false,
      })

      return result
    } catch (error) {
      if (!isActiveToken(token)) return null
      set({ actionError: error.message, isSubmitting: false })
      return null
    }
  },

  uploadAvatar: async (file) => {
    if (get().isSubmitting) return null

    const token = getActiveToken()

    if (!token) {
      set({ actionError: 'Authentication required' })
      return null
    }

    set({ actionError: '', isSubmitting: true })

    try {
      const { currentProfile, result } = await saveAvatar({ file, token })
      if (!isActiveToken(token)) return null

      set({ currentProfile, isSubmitting: false })

      return result
    } catch (error) {
      if (!isActiveToken(token)) return null
      set({ actionError: error.message, isSubmitting: false })
      return null
    }
  },

  removeAvatar: async () => {
    if (get().isSubmitting) return null

    const token = getActiveToken()

    if (!token) {
      set({ actionError: 'Authentication required' })
      return null
    }

    set({ actionError: '', isSubmitting: true })

    try {
      const { currentProfile, result } = await clearAvatar({ token })
      if (!isActiveToken(token)) return null

      set({ currentProfile, isSubmitting: false })

      return result
    } catch (error) {
      if (!isActiveToken(token)) return null
      set({ actionError: error.message, isSubmitting: false })
      return null
    }
  },
})
