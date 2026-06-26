const logger = require('#utils/logger')

const registerHandlers = (io, socket) => {
  socket.join('channel:#general')

  logger.info('user connected:', socket.user)

  socket.on('disconnect', () => {
    logger.info('user disconnected', socket.user)
  })

  socket.on('message', (data) => {
    logger.info(data)
    data.user = socket.user
    io.to(data.room).emit('message', data)
  })
}

module.exports = registerHandlers
