import request from '@/utils/request'

// Administration console API (#499). One function per endpoint; the response
// shapes are pinned on the backend epic (#480) so both sides build against one
// contract. Components never import these — they go through useAdminStore.

export const fetchAdminStats = (token) => {
  return request('/admin/stats', { token })
}

export const fetchAdminUsers = (
  { query = '', status = '', role = '', page = 1, limit = 10 } = {},
  token,
) => {
  const params = new URLSearchParams({ page, limit })
  if (query) params.set('q', query)
  if (status) params.set('status', status)
  if (role) params.set('role', role)

  return request(`/admin/users?${params.toString()}`, { token })
}

export const fetchAdminUserDetail = (userId, token) => {
  return request(`/admin/users/${userId}`, { token })
}

export const updateAdminUserRole = (userId, role, token) => {
  return request(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
    token,
  })
}

export const suspendAdminUser = (userId, { suspendedUntil, reason }, token) => {
  return request(`/admin/users/${userId}/suspend`, {
    method: 'POST',
    body: { suspendedUntil, reason },
    token,
  })
}

export const banAdminUser = (userId, reason, token) => {
  return request(`/admin/users/${userId}/ban`, {
    method: 'POST',
    body: { reason },
    token,
  })
}

export const reinstateAdminUser = (userId, token) => {
  return request(`/admin/users/${userId}/reinstate`, {
    method: 'POST',
    token,
  })
}

export const deleteAdminUser = (userId, token) => {
  return request(`/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  })
}
