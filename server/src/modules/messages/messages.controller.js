const messagesService = require('#modules/messages/messages.service')

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
    res.json(await messagesService.markAllConversationsRead(req.user))
  } catch (error) {
    next(error)
  }
}

const listMessages = async (req, res, next) => {
  try {
    res.json(await messagesService.listMessages(req.user, req.params))
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
