import request from '@/utils/request'

const encodeSegment = (value) => encodeURIComponent(value)

const getRoomPath = (roomId) => `/chat/rooms/${encodeSegment(roomId)}`

const getRoomMemberPath = ({ roomId, targetUserId }) => {
  return `${getRoomPath(roomId)}/members/${encodeSegment(targetUserId)}`
}

export const getRooms = (token) => {
  return request('/chat/rooms', { token })
}

export const createRoom = ({ name, visibility }, token) => {
  return request('/chat/rooms', {
    method: 'POST',
    body: { name, visibility },
    token,
  })
}

export const joinRoom = (roomId, token) => {
  return request(`${getRoomPath(roomId)}/join`, {
    method: 'POST',
    token,
  })
}

export const getMessages = (roomId, token) => {
  return request(`${getRoomPath(roomId)}/messages`, {
    token,
  })
}

export const inviteUserToRoom = ({ roomId, targetUserId }, token) => {
  return request(`${getRoomPath(roomId)}/invitations`, {
    method: 'POST',
    body: { targetUserId },
    token,
  })
}

export const updateRoomMember = ({ isMuted, roomId, targetUserId }, token) => {
  return request(getRoomMemberPath({ roomId, targetUserId }), {
    method: 'PATCH',
    body: { isMuted },
    token,
  })
}

export const removeRoomMember = ({ roomId, targetUserId }, token) => {
  return request(getRoomMemberPath({ roomId, targetUserId }), {
    method: 'DELETE',
    token,
  })
}
