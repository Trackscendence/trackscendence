const { Server } = require('socket.io')
const { authenticate } = require('./socket.middleware')
const registerHandlers = require('./socket.handlers')

const logger = require('#utils/logger')

const initWebSocket = (server) => {
  const io = new Server(server, {
    path: '/websocket/',
  })

  io.use(authenticate)

  io.on('connection', (socket) => {
    registerHandlers(io, socket)
  })

  return io
}

module.exports = initWebSocket
