const friendsRepository = require('#modules/friends/friends.repository')
const logger = require('#utils/logger')

const PRIVATE_ROOM_PREFIX = 'user:'

const isObjectPayload = (data) => {
  return Boolean(data) && typeof data === 'object' && !Array.isArray(data)
}

const getTrimmedString = (value) => {
  return typeof value === 'string' ? value.trim() : ''
}

const parsePrivateRecipientId = (recipient) => {
  if (!recipient.startsWith(PRIVATE_ROOM_PREFIX)) return null

  const userId = Number(recipient.slice(PRIVATE_ROOM_PREFIX.length))
  if (!Number.isInteger(userId) || userId < 1) return null

  return userId
}

const buildChatUser = (user) => ({
  id: user.id,
  username: user.username,
})

const buildChatPayload = ({ message, recipient, socket }) => ({
  message,
  recipient,
  user: buildChatUser(socket.user),
})

const emitChatError = (socket, message) => {
  socket.emit('chat:error', { message })
}

const assertCanSendPrivateMessage = async ({
  recipientId,
  repository,
  senderId,
}) => {
  if (recipientId === senderId) return false

  const relationship = await repository.findRelationshipBetweenUsers(
    senderId,
    recipientId,
  )

  return relationship?.status === 'ACCEPTED'
}

const registerChatHandlers = (
  io,
  socket,
  { repository = friendsRepository } = {},
) => {
  const handleRoomMessage = (data) => {
    if (!isObjectPayload(data)) return

    const recipient = getTrimmedString(data.recipient || data.room)
    const message = getTrimmedString(data.message)

    if (
      !recipient ||
      !message ||
      recipient.startsWith(PRIVATE_ROOM_PREFIX) ||
      !socket.rooms.has(recipient)
    ) {
      return
    }

    io.to(recipient).emit(
      'chat:message',
      buildChatPayload({ message, recipient, socket }),
    )
  }

  socket.on('chat:message', handleRoomMessage)

  socket.on('chat:private_message', async (data) => {
    if (!isObjectPayload(data)) return

    const recipient = getTrimmedString(data.recipient)
    const message = getTrimmedString(data.message)
    const recipientId = parsePrivateRecipientId(recipient)

    if (!recipientId || !message) return

    try {
      const canSend = await assertCanSendPrivateMessage({
        recipientId,
        repository,
        senderId: socket.user.id,
      })

      if (!canSend) {
        emitChatError(
          socket,
          'Private messages are only available between friends',
        )
        return
      }

      const payload = buildChatPayload({ message, recipient, socket })
      io.to(`${PRIVATE_ROOM_PREFIX}${socket.user.id}`).emit(
        'chat:private_message',
        payload,
      )
      io.to(recipient).emit('chat:private_message', payload)
    } catch (error) {
      logger.error('Failed to send private chat message', error)
      emitChatError(socket, 'Unable to send private message')
    }
  })
}

module.exports = {
  parsePrivateRecipientId,
  registerChatHandlers,
}
