const notificationsService = require('#modules/notifications/notifications.service')

const listNotifications = async (req, res, next) => {
  try {
    res.json(await notificationsService.listNotifications(req.user))
  } catch (error) {
    next(error)
  }
}

const markNotificationRead = async (req, res, next) => {
  try {
    res.json(
      await notificationsService.markNotificationRead(req.user, req.params),
    )
  } catch (error) {
    next(error)
  }
}

const markAllNotificationsRead = async (req, res, next) => {
  try {
    res.json(await notificationsService.markAllNotificationsRead(req.user))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
}
