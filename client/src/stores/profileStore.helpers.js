import { AUTH_TOKEN_KEY } from '@/services/auth'
import {
  listFriendRequests,
  listFriends,
  sendFriendRequest,
} from '@/services/friends'
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
  incomingRequests: [],
  outgoingRequests: [],
  leaderboard: [],
}

export const getActiveToken = () => {
  return useAuthStore.getState().token || localStorage.getItem(AUTH_TOKEN_KEY)
}

export const loadFriendContext = async (token) => {
  const [friendsResult, requestsResult] = await Promise.all([
    listFriends(token),
    listFriendRequests(token),
  ])

  return {
    friends: friendsResult.friends || [],
    incomingRequests: requestsResult.incoming || [],
    outgoingRequests: requestsResult.outgoing || [],
  }
}

export const loadLeaderboardContext = async (token) => {
  try {
    const result = await getLeaderboard({}, token)

    return {
      leaderboard: result.leaderboard || [],
    }
  } catch {
    return {
      leaderboard: [],
    }
  }
}

export const loadCurrentProfileData = async (token) => {
  const [profileResult, friendContext, leaderboardContext] = await Promise.all([
    getProfile(token),
    loadFriendContext(token),
    loadLeaderboardContext(token),
  ])
  return {
    currentProfile: profileResult.user,
    relationship: profileResult.relationship,
    ...friendContext,
    leaderboard: leaderboardContext.leaderboard,
  }
}

export const loadPublicProfileData = async ({ token, username }) => {
  const [result, leaderboardContext] = await Promise.all([
    getUserByUsername(username, token),
    loadLeaderboardContext(token),
  ])
  return {
    publicProfile: result.user,
    relationship: result.relationship,
    leaderboard: leaderboardContext.leaderboard,
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
