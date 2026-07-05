import request from '@/utils/request'

export const listFriends = (token) => {
  return request('/friends', { token })
}

export const listFriendRequests = (token) => {
  return request('/friends/requests', { token })
}

export const sendFriendRequest = (targetUserId, token) => {
  return request('/friends/request', {
    method: 'POST',
    body: { targetUserId },
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
