const app = require('#app')
const { createServer } = require('node:http')
const config = require('#utils/config')
const logger = require('#utils/logger')

const server = createServer(app)

const initWebSocket = require('./src/socket/socket.service')
initWebSocket(server)
// Bind to :: (all IPv6) so the server is reachable over Railway's IPv6-only
// private network. Dual-stack accepts IPv4-mapped connections too, so Docker
// Compose (which reaches the server over IPv4) keeps working unchanged.
server.listen(config.PORT, '::', () => {
  logger.info(`Server running on port ${config.PORT}`)
})
