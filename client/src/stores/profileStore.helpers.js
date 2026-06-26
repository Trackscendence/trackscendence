import { AUTH_TOKEN_KEY } from '@/services/auth'
import {
  listFriendRequests,
  listFriends,
  sendFriendRequest,
} from '@/services/friends'
import { getLeaderboard } from '@/services/game'
import { getProfile, getUserByUsername, updateProfile } from '@/services/users'
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
    const result = await getLeaderboard(token)

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
    ...leaderboardContext,
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
    ...leaderboardContext,
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
