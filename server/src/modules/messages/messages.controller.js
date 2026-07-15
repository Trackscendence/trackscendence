const messagesService = require('#modules/messages/messages.service')

const CHAT_CONVERSATION_READ_EVENT = 'chat:conversation_read'
const USER_ROOM_PREFIX = 'user:'

const serializeTimestamp = (value) => {
  return value instanceof Date ? value.toISOString() : value
}

const getConversationReadNotifier = (req) => {
  const io = req.app.get('io')
  if (!io) return undefined

  return ({ conversationId, readAt, recipientId }) => {
    if (!conversationId || !recipientId || !readAt) return

    io.to(`${USER_ROOM_PREFIX}${recipientId}`).emit(
      CHAT_CONVERSATION_READ_EVENT,
      {
        conversationId,
        readAt: serializeTimestamp(readAt),
      },
    )
  }
}

const listConversations = async (req, res, next) => {
  try {
    res.json(await messagesService.listConversations(req.user))
  } catch (error) {
    next(error)
  }
}

const getOrCreateConversation = async (req, res, next) => {
  try {
    res.json(await messagesService.getOrCreateConversation(req.user, req.body))
  } catch (error) {
    next(error)
  }
}

const markAllConversationsRead = async (req, res, next) => {
  try {
    res.json(
      await messagesService.markAllConversationsRead(req.user, {
        onConversationRead: getConversationReadNotifier(req),
      }),
    )
  } catch (error) {
    next(error)
  }
}

const listMessages = async (req, res, next) => {
  try {
    res.json(
      await messagesService.listMessages(req.user, req.params, {
        onConversationRead: getConversationReadNotifier(req),
      }),
    )
  } catch (error) {
    next(error)
  }
}

const sendMessage = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await messagesService.sendMessage(req.user, req.params, req.body))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getOrCreateConversation,
  listConversations,
  listMessages,
  markAllConversationsRead,
  sendMessage,
}
