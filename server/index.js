const app = require('#app')
const { createServer } = require('node:http')
const fs = require('node:fs/promises')
const { constants: fsConstants } = require('node:fs')
const config = require('#utils/config')
const logger = require('#utils/logger')
const prisma = require('#db/prisma')
const { AVATAR_UPLOAD_DIR } = require('#modules/users/users.avatar')
const { registerGracefulShutdown } = require('./src/server/graceful-shutdown')

const server = createServer(app)

// Create the avatar upload dir at boot and confirm it is writable. On Railway
// the filesystem is ephemeral unless a volume is mounted at /app/uploads, so
// surfacing this here turns a missing mount into an obvious startup log line
// instead of a silent 404 on every avatar after the next redeploy.
const verifyUploadsWritable = async () => {
  try {
    await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true })
    await fs.access(AVATAR_UPLOAD_DIR, fsConstants.W_OK)
    logger.info(`Avatar uploads directory ready at ${AVATAR_UPLOAD_DIR}`)
  } catch (error) {
    logger.error(
      `Avatar uploads directory is not writable at ${AVATAR_UPLOAD_DIR}: ${error.message}`,
    )
  }
}
verifyUploadsWritable()

const initWebSocket = require('./src/socket/socket.service')
const {
  setSocketServer,
} = require('#modules/notifications/notifications.socket')
const io = initWebSocket(server)
const { setPresenceSocketServer } = require('#modules/socket/presence.service')

app.set('io', io)
setSocketServer(io)
setPresenceSocketServer(io)

registerGracefulShutdown({ io, logger, prisma, server })

// Bind to :: (all IPv6) so the server is reachable over Railway's IPv6-only
// private network. Dual-stack accepts IPv4-mapped connections too, so Docker
// Compose (which reaches the server over IPv4) keeps working unchanged.
server.listen(config.PORT, '::', () => {
  logger.info(`Server running on port ${config.PORT}`)
})
