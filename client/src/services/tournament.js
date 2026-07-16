import request from '@/utils/request'

export const getTournaments = (token, { status } = {}) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/tournaments${query}`, { token })
}

// The caller's own tournament: the OPEN one they joined or the RUNNING one
// they play in. `{ tournament: null }` when they have none.
export const getActiveTournament = (token) => {
  return request('/tournaments/active', { token })
}

export const getTournament = (id, token) => {
  return request(`/tournaments/${encodeURIComponent(id)}`, { token })
}

export const createTournament = (payload, token) => {
  return request('/tournaments', { method: 'POST', body: payload, token })
}

export const joinTournament = (id, token) => {
  return request(`/tournaments/${encodeURIComponent(id)}/join`, {
    method: 'POST',
    token,
  })
}

export const leaveTournament = (id, token) => {
  return request(`/tournaments/${encodeURIComponent(id)}/leave`, {
    method: 'POST',
    token,
  })
}
