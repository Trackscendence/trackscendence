import request from '@/utils/request'

const updateCurrentUserProfileRequest = (payload, token) => {
  return request('/users/me', {
    method: 'PATCH',
    body: payload,
    token,
  })
}

export const getProfile = (token) => {
  return request('/auth/me', { token })
}

export const updateProfile = updateCurrentUserProfileRequest

export const fetchUserProfile = (username, token) => {
  return request(`/users/${encodeURIComponent(username)}`, { token })
}

export const updateCurrentUserProfile = updateCurrentUserProfileRequest

export const getUserByUsername = fetchUserProfile

export const getFriends = (token) => {
  return request('/friends', { token })
}
