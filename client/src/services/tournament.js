import request from '@/utils/request'

export const getTournaments = (token) => {
  return request('/tournaments', { token })
}

export const getTournament = (id, token) => {
  return request(`/tournaments/${id}`, { token })
}

export const joinTournament = (id, token) => {
  return request(`/tournaments/${id}/join`, {
    method: 'POST',
    token,
  })
}
