import { AUTH_TOKEN_KEY } from '@/services/auth'
import {
  listFriendRequests,
  listFriends,
  sendFriendRequest,
} from '@/services/friends'
import { getProfile, getUserByUsername, updateProfile } from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'

export const emptyFriendContext = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
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
