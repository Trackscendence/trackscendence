import request from '@/utils/request'

export const getProfile = (token) => {
  return request('/users/me', { token })
}

export const updateProfile = (payload, token) => {
  return request('/users/me', {
    method: 'PATCH',
    body: payload,
    token,
  })
}

export const getUserByUsername = (username, token) => {
  return request(`/users/${encodeURIComponent(username)}`, { token })
}

export const searchUsers = ({ q, page = 1, limit = 10 } = {}, token) => {
  const query = new URLSearchParams({ q, page, limit })

  return request(`/users/search?${query.toString()}`, { token })
}
