let io = null

const setSocketServer = (socketServer) => {
  io = socketServer
}

const isUserOnline = async (userId) => {
  if (!io) return false

  const sockets = await io.in(`user:${userId}`).fetchSockets()
  return sockets.length > 0
}

module.exports = {
  setSocketServer,
  isUserOnline,
}
