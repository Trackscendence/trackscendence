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

    set({ leaderboard })
  },

  loadCurrentProfile: createCurrentProfileLoader({
    emptyFriendContext,
    get,
    getAuthUserId: () => useAuthStore.getState().user?.id,
    loadCurrentProfileData,
    requireToken,
    set,
  }),

  loadPublicProfile: createPublicProfileLoader({
    get,
    loadPublicProfileData,
    requireToken,
    set,
  }),

  refreshFriendContext: async () => {
    const token = getActiveToken()

    if (!token) return

    set(await loadFriendContext(token))
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
      set({
        ...(await requestFriendship({ message, profileId: profile.id, token })),
        isSubmitting: false,
      })
      notifications.push('Friend request sent', 'success')
      return true
    } catch (error) {
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

      set({ currentProfile, isSubmitting: false })

      return result
    } catch (error) {
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

      set({ currentProfile, isSubmitting: false })

      return result
    } catch (error) {
      set({ actionError: error.message, isSubmitting: false })
      return null
    }
  },
})
