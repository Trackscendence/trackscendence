const { Router } = require('express')
const chatRoomController = require('#modules/chat/chat-room.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.use(requireAuth)

router.get('/rooms', chatRoomController.listRooms)
router.post('/rooms', chatRoomController.createRoom)
router.post('/rooms/:roomId/join', chatRoomController.joinRoom)
router.get('/rooms/:roomId/messages', chatRoomController.listMessages)
router.post('/rooms/:roomId/invitations', chatRoomController.inviteUser)
router.patch(
  '/rooms/:roomId/members/:targetUserId',
  chatRoomController.setMemberMuted,
)
router.delete(
  '/rooms/:roomId/members/:targetUserId',
  chatRoomController.removeMember,
)

module.exports = router
