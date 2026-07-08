const { Router } = require('express')
const messagesController = require('#modules/messages/messages.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.use(requireAuth)

router.get('/conversations', messagesController.listConversations)
router.post('/conversations', messagesController.getOrCreateConversation)
router.get(
  '/conversations/:conversationId/messages',
  messagesController.listMessages,
)
router.post(
  '/conversations/:conversationId/messages',
  messagesController.sendMessage,
)

module.exports = router
