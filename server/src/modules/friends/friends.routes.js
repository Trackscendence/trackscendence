const { Router } = require('express')
const friendsController = require('#modules/friends/friends.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.use(requireAuth)

router.get('/', friendsController.listFriends)
router.get('/requests', friendsController.listFriendRequests)
router.post('/request', friendsController.sendFriendRequest)
router.post('/respond', friendsController.respondToFriendRequest)
router.delete('/:targetUserId', friendsController.deleteRelationship)

module.exports = router
