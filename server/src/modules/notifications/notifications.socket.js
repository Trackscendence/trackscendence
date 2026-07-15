const SOCIAL_NOTIFICATIONS_CHANGED_EVENT = 'social:notifications_changed'

let socketServer = null

const setSocketServer = (io) => {
  socketServer = io
}

const emitSocialNotificationsChanged = (userId) => {
  if (!socketServer || !userId) return

  socketServer.to(`user:${userId}`).emit(SOCIAL_NOTIFICATIONS_CHANGED_EVENT)
}

module.exports = {
  SOCIAL_NOTIFICATIONS_CHANGED_EVENT,
  emitSocialNotificationsChanged,
  setSocketServer,
}
