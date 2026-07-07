import { getStoredToken } from '@/services/auth'
import { listFriends, sendFriendRequest } from '@/services/friends'
import { getLeaderboard } from '@/services/game'
import {
  deleteAvatar,
  getProfile,
  getUserByUsername,
  updateProfile,
  uploadAvatar,
} from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'

export const emptyFriendContext = {
  friends: [],
  leaderboard: [],
}

export const getActiveToken = () => {
  return useAuthStore.getState().token || getStoredToken()
}

export const loadFriendContext = async (token) => {
  const friendsResult = await listFriends(token)

  return {
    friends: friendsResult.friends || [],
  }
}

export const loadLeaderboardContext = async (token) => {
  try {
    const result = await getLeaderboard({ limit: 5 }, token)

    return {
      leaderboard: result.leaderboard || [],
    }
  } catch {
    return {
      leaderboard: [],
    }
  }
}

// The leaderboard aggregation is intentionally left out of these fetches so the
// profile and friends resolve without waiting on it. The store loads it off the
// critical path via loadLeaderboardContext once the profile has rendered.
export const loadCurrentProfileData = async (token) => {
  const [profileResult, friendContext] = await Promise.all([
    getProfile(token),
    loadFriendContext(token),
  ])
  return {
    currentProfile: profileResult.user,
    relationship: profileResult.relationship,
    ...friendContext,
  }
}

export const loadPublicProfileData = async ({ token, username }) => {
  const result = await getUserByUsername(username, token)
  return {
    publicProfile: result.user,
    relationship: result.relationship,
  }
}

export const requestFriendship = async ({ profileId, token }) => {
  await sendFriendRequest(profileId, token)

  return {
    relationship: { status: 'PENDING_OUTGOING' },
  }
}

export const saveCurrentProfile = async ({ payload, token }) => {
  const result = await updateProfile(payload, token)
  useAuthStore.getState().updateUser(result.authUser)

  return {
    currentProfile: result.user,
    result,
  }
}

// Avatar upload and removal share the profile-update shape: the server returns
// the refreshed profile plus an auth payload, so both the profile store and the
// session user (navbar, settings preview) stay in sync from one response.
export const saveAvatar = async ({ file, token }) => {
  const result = await uploadAvatar(file, token)
  useAuthStore.getState().updateUser(result.authUser)

  return {
    currentProfile: result.user,
    result,
  }
}

export const clearAvatar = async ({ token }) => {
  const result = await deleteAvatar(token)
  useAuthStore.getState().updateUser(result.authUser)

  return {
    currentProfile: result.user,
    result,
  }
}
