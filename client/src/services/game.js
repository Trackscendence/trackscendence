import request from '@/utils/request'

export const getLeaderboard = (params = {}, token) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const queryString = query.toString()

  return request(`/game/leaderboard${queryString ? `?${queryString}` : ''}`, {
    token,
  })
}
