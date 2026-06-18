const { Router } = require('express')
const usersController = require('#modules/users/users.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.patch('/me', requireAuth, usersController.updateCurrentUserProfile)
router.get('/:username', usersController.getProfile)

module.exports = router
