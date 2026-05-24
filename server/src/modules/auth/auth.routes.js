const { Router } = require('express')
const authController = require('#modules/auth/auth.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', requireAuth, authController.me)
router.post('/logout', authController.logout)

module.exports = router
