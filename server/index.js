const app = require('#app')
const { createServer } = require('node:http')
const config = require('#utils/config')
const logger = require('#utils/logger')

const server = createServer(app)

const initWebSocket = require('./src/socket/socket.service')
initWebSocket(server)

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`)
})
