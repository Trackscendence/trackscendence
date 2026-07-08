import request from '@/utils/request'

const encodeSegment = (value) => encodeURIComponent(value)

export const getConversations = (token) => {
  return request('/messages/conversations', { token })
}

export const getOrCreateConversation = (targetUserId, token) => {
  return request('/messages/conversations', {
    method: 'POST',
    body: { targetUserId },
    token,
  })
}

export const getConversationMessages = (conversationId, token) => {
  return request(
    `/messages/conversations/${encodeSegment(conversationId)}/messages`,
    { token },
  )
}

export const sendConversationMessage = ({ conversationId, message }, token) => {
  return request(
    `/messages/conversations/${encodeSegment(conversationId)}/messages`,
    {
      method: 'POST',
      body: { message },
      token,
    },
  )
}
