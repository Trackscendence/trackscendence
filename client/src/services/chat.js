import request from '@/utils/request'

export const getRooms = (token) => {
  return request('/chat/rooms', { token })
}

export const getMessages = (roomId, token) => {
  return request(`/chat/rooms/${roomId}/messages`, { token })
}
