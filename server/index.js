const app = require('#app')
const { createServer } = require('node:http')
const authService = require('#modules/auth/auth.service')
const config = require('#utils/config')
const logger = require('#utils/logger')

const server = createServer(app)

const { Server } = require('socket.io')

const io = new Server(server, {
  path: '/websocket/',
})

io.use(async (socket, next) => {
  try {
    let token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization
    if (!token) {
      return next(new Error('Authentication error'))
    }
    
    // Normalize in case headers.authorization is an array
    if (Array.isArray(token)) {
      token = token[0]
    }
    
    const extractedToken = token.startsWith('Bearer ')
      ? token.split(' ')[1]
      : token
    const user = await authService.getUserFromToken(extractedToken)
    socket.user = { id: user.id, username: user.username }
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
})

io.on('connection', (socket) => {
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
})

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`)
})
