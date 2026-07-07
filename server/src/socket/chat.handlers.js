const friendsRepository = require('#modules/friends/friends.repository')
const chatRoomService = require('#modules/chat/chat-room.service')
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
  { repository = friendsRepository, chatRooms = chatRoomService } = {},
) => {
  chatRooms
    .listActiveSocketRoomsForUser(socket.user.id)
    .then((rooms) => {
      rooms.forEach((room) => socket.join(room))
    })
    .catch((error) => logger.error('Failed to join chat rooms', error))

  const emitChatRooms = async () => {
    socket.emit('chat:rooms', await chatRooms.listRooms(socket.user))
  }

  const handleRoomMessage = async (data) => {
    if (!isObjectPayload(data)) return

    const recipient = getTrimmedString(data.recipient || data.room)
    const message = getTrimmedString(data.message)

    if (!recipient || !message || recipient.startsWith(PRIVATE_ROOM_PREFIX)) {
      return
    }

    const chatRoomId = chatRooms.parseChatRoomRecipientId(recipient)
    if (chatRoomId) {
      try {
        const payload = await chatRooms.createMessage(socket.user, {
          message,
          recipient,
        })
        const memberUserIds =
          await chatRooms.listActiveMemberUserIds(chatRoomId)
        memberUserIds.forEach((userId) => {
          io.to(`user:${userId}`).emit('chat:message', payload)
        })
      } catch (error) {
        logger.error('Failed to send chat room message', error)
        emitChatError(socket, error.message || 'Unable to send room message')
      }
      return
    }

    if (!socket.rooms.has(recipient)) return

    io.to(recipient).emit(
      'chat:message',
      buildChatPayload({ message, recipient, socket }),
    )
  }

  socket.on('chat:message', handleRoomMessage)

  socket.on('chat:rooms:list', async () => {
    try {
      await emitChatRooms()
    } catch (error) {
      logger.error('Failed to list chat rooms', error)
      emitChatError(socket, 'Unable to list chat rooms')
    }
  })

  socket.on('chat:room_create', async (data) => {
    if (!isObjectPayload(data)) return

    try {
      const { room } = await chatRooms.createRoom(socket.user, data)
      socket.join(room.socketRoom)
      socket.emit('chat:room', room)
      await emitChatRooms()
    } catch (error) {
      logger.error('Failed to create chat room', error)
      emitChatError(socket, error.message || 'Unable to create chat room')
    }
  })

  socket.on('chat:room_join', async (data) => {
    if (!isObjectPayload(data)) return

    try {
      const { room } = await chatRooms.joinRoom(socket.user, {
        roomId: data.roomId,
      })
      socket.join(room.socketRoom)
      socket.emit('chat:room', room)
      await emitChatRooms()
    } catch (error) {
      logger.error('Failed to join chat room', error)
      emitChatError(socket, error.message || 'Unable to join chat room')
    }
  })

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
