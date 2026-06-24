import request from '@/utils/request'

export const getMatchHistory = ({ page = 1, pageSize = 10 } = {}, token) => {
  return request(`/game/history?page=${page}&pageSize=${pageSize}`, { token })
}

export const getLeaderboard = (token) => {
  return request('/game/leaderboard', { token })
}
