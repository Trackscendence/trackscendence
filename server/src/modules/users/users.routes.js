const { Router } = require('express')
const {
  attachUserIfPresent,
  requireAuth,
} = require('#middleware/auth.middleware')
const usersController = require('#modules/users/users.controller')

const router = Router()

router.get('/me', requireAuth, usersController.getCurrentProfile)
router.patch('/me', requireAuth, usersController.updateCurrentUserProfile)
router.get('/:username', attachUserIfPresent, usersController.getProfile)

module.exports = router
