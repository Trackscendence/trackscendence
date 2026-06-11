const { Router } = require('express')
const authController = require('#modules/auth/auth.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/forgot-password', authController.requestPasswordReset)
router.post('/reset-password', authController.resetPassword)
router.post('/change-password', requireAuth, authController.changePassword)
router.get('/me', requireAuth, authController.me)
router.post('/logout', authController.logout)

module.exports = router
