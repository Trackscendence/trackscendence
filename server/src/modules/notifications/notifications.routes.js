const { Router } = require('express')
const notificationsController = require('#modules/notifications/notifications.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.use(requireAuth)

router.get('/', notificationsController.listNotifications)
router.post('/read-all', notificationsController.markAllNotificationsRead)
router.patch(
  '/:notificationId/read',
  notificationsController.markNotificationRead,
)

module.exports = router
