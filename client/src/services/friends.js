import request from '@/utils/request'

export const listFriends = (token) => {
  return request('/friends', { token })
}

export const listFriendRequests = (token) => {
  return request('/friends/requests', { token })
}

export const sendFriendRequest = (targetUserIdOrPayload, token, message) => {
  const body =
    typeof targetUserIdOrPayload === 'object'
      ? targetUserIdOrPayload
      : { message, targetUserId: targetUserIdOrPayload }

  return request('/friends/request', {
    method: 'POST',
    body,
    token,
  })
}

export const respondToFriendRequest = ({ targetUserId, action }, token) => {
  return request('/friends/respond', {
    method: 'POST',
    body: { targetUserId, action },
    token,
  })
}

export const deleteRelationship = (targetUserId, token) => {
  return request(`/friends/${targetUserId}`, {
    method: 'DELETE',
    token,
  })
}

export const blockUser = (targetUserId, token) => {
  return request(`/friends/${targetUserId}/block`, {
    method: 'POST',
    token,
  })
}

export const unblockUser = (targetUserId, token) => {
  return request(`/friends/${targetUserId}/unblock`, {
    method: 'POST',
    token,
  })
}
