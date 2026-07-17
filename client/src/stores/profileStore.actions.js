import {
  clearAvatar,
  emptyFriendsAndLeaderboard,
  getActiveToken,
  loadCurrentProfileData,
  loadFriendsList,
  loadLeaderboardContext,
  loadPublicProfileData,
  removeFriendship,
  requestFriendship,
  respondFriendship,
  saveAvatar,
  saveCurrentProfile,
} from './profileStore.helpers'
import { createCurrentProfileLoader } from './profileStore.currentProfileLoader'
import { createPublicProfileLoader } from './profileStore.publicProfileLoader'
import {
  applyFriendRequestResponsePatch,
  applyRelationshipRemovalPatch,
} from './profileStore.relationshipPatch'
import { isActiveToken } from './sessionGuard'
import useAuthStore from './useAuthStore'
import useNotificationStore from './useNotificationStore'
import useSocialNotificationStore from './useSocialNotificationStore'

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
    emptyFriendsAndLeaderboard,
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

  // Never rejects: callers fire this off the critical path (after an accept,
  // an unfriend, or a chat mount), so a failed refresh just keeps the previous
  // friends list instead of surfacing as an unhandled rejection.
  refreshFriends: async () => {
    const token = getActiveToken()

    if (!token) return

    try {
      const friendsData = await loadFriendsList(token)
      if (!isActiveToken(token)) return

      set(friendsData)
    } catch {
      // The sidebar keeps the list it already has.
    }
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

  // Answer the viewed profile's incoming friend request from the profile
  // itself. Accept flips the relationship to FRIENDS and refreshes the friends
  // context; reject clears the pending row so the pair can request again.
  respondToFriendRequest: async (action) => {
    const token = getActiveToken()
    const profile = get().publicProfile
    const notifications = useNotificationStore.getState()

    if (!token) {
      notifications.push('Authentication required', 'error')
      return null
    }

    if (!profile || get().isSubmitting) return null

    set({ actionError: '', isSubmitting: true })

    try {
      const result = await respondFriendship({
        action,
        profileId: profile.id,
        token,
      })
      if (!isActiveToken(token)) return null
      // An accept changes the accepted-friendship total on both sides, so
      // patch the cached counts the stat strip reads (#396); the next full
      // profile load restores server truth.
      set((state) => ({
        isSubmitting: false,
        ...applyFriendRequestResponsePatch({
          action,
          relationship: result.relationship,
          state,
        }),
      }))
      notifications.push(
        action === 'accept'
          ? 'Friend request accepted'
          : 'Friend request rejected',
        action === 'accept' ? 'success' : 'info',
      )
      if (action === 'accept') get().refreshFriends()
      // Drop the request's inline actions from the bell synchronously, so it
      // can never briefly offer a response that was already given (even if
      // the background reload below fails); then reload for full truth.
      // loadNotifications handles its own failures.
      const socialNotifications = useSocialNotificationStore.getState()
      socialNotifications.markFriendRequestHandled(
        profile.id,
        result.conversationId,
      )
      socialNotifications.loadNotifications()
      return result
    } catch (error) {
      if (!isActiveToken(token)) return null
      notifications.push(error.message, 'error')
      set({ actionError: '', isSubmitting: false })
      return null
    }
  },

  // Cancel an outgoing request or unfriend, both through the same delete
  // endpoint; the relationship returns to none, so the profile shows
  // "Add a friend" again.
  removeRelationship: async () => {
    const token = getActiveToken()
    const profile = get().publicProfile
    const wasFriends = get().relationship?.status === 'FRIENDS'
    const notifications = useNotificationStore.getState()

    if (!token) {
      notifications.push('Authentication required', 'error')
      return false
    }

    if (!profile || get().isSubmitting) return false

    set({ actionError: '', isSubmitting: true })

    try {
      const result = await removeFriendship({ profileId: profile.id, token })
      if (!isActiveToken(token)) return false
      // Unfriending shrinks the accepted-friendship total on both sides;
      // cancelling a pending request never counted, so no patch there.
      set((state) => ({
        isSubmitting: false,
        ...applyRelationshipRemovalPatch({
          relationship: result.relationship,
          state,
          wasFriends,
        }),
      }))
      notifications.push(
        wasFriends ? 'Friend removed' : 'Friend request cancelled',
        'info',
      )
      if (wasFriends) get().refreshFriends()
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
