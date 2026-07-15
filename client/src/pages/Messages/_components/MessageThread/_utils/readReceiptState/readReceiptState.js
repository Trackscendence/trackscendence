const getTimestamp = (value) => {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const isMessageReadAt = (message, lastReadTimestamp) => {
  if (lastReadTimestamp === null) return false

  const messageTimestamp = getTimestamp(message.createdAt)
  return messageTimestamp !== null && messageTimestamp <= lastReadTimestamp
}

export const getMessageReceiptState = ({
  conversation,
  currentUserId,
  message,
}) => {
  const isOwn = String(message.senderId) === String(currentUserId)
  const friendLastReadTimestamp = getTimestamp(conversation.friendLastReadAt)
  const viewerLastReadTimestamp = getTimestamp(conversation.lastReadAt)

  return {
    isOwn,
    isRead: isMessageReadAt(
      message,
      isOwn ? friendLastReadTimestamp : viewerLastReadTimestamp,
    ),
  }
}
