import request from '@/utils/request'

export const getMatchHistory = ({ page = 1, pageSize = 10 } = {}, token) => {
  return request(`/game/history?page=${page}&pageSize=${pageSize}`, { token })
}

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
