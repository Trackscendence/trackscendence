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
    // Under LOG_LEVEL=debug, trace every inbound event in one place so a
    // misbehaving client is legible without scattering logs through each
    // handler. The tap is only attached when debug is on, so it costs nothing
    // at the default level.
    if (logger.isLevelEnabled('debug')) {
      socket.onAny((event, ...args) => {
        const [payload] = args
        logger.debug(`socket recv: ${event}`, {
          user: socket.user?.username,
          keys:
            payload && typeof payload === 'object'
              ? Object.keys(payload)
              : undefined,
        })
      })
    }

    registerHandlers(io, socket)
  })

  return io
}

module.exports = initWebSocket
