import request from '@/utils/request'

export const getTournaments = (token) => {
  return request('/tournaments', { token })
}

export const getTournament = (id, token) => {
  return request(`/tournaments/${encodeURIComponent(id)}`, { token })
}

export const joinTournament = (id, token) => {
  return request(`/tournaments/${encodeURIComponent(id)}/join`, {
    method: 'POST',
    token,
  })
}
