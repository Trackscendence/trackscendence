import { request } from './api'

export const fetchUserProfile = (username, token) => {
  return request(`/users/${encodeURIComponent(username)}`, { token })
}

export const updateCurrentUserProfile = (payload, token) => {
  return request('/users/me', {
    method: 'PATCH',
    body: payload,
    token,
  })
}
