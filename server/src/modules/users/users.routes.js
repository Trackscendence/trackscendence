const { Router } = require('express')
const { requireAuth } = require('#middleware/auth.middleware')
const usersController = require('#modules/users/users.controller')

const router = Router()

router.use(requireAuth)

router.get('/me', usersController.getCurrentProfile)
router.patch('/me', usersController.updateCurrentUserProfile)
router.get('/:username', usersController.getProfile)

module.exports = router
