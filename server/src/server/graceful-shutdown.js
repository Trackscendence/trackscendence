const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10000
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT']

const closeHttpServer = (server) =>
  new Promise((resolve, reject) => {
    if (!server?.listening) {
      resolve()
      return
    }

    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })

const closeSocketServer = (io) =>
  new Promise((resolve) => {
    if (!io?.close) {
      resolve()
      return
    }

    io.close(resolve)
  })

const createGracefulShutdown = ({
  io = null,
  logger,
  prisma,
  processRef = process,
  server,
  shutdownTimeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
  timers = { clearTimeout, setTimeout },
}) => {
  let shutdownPromise = null

  return async (signal = 'SIGTERM') => {
    if (shutdownPromise) return shutdownPromise

    shutdownPromise = (async () => {
      const timeout = timers.setTimeout(() => {
        logger.error(`Graceful shutdown timed out after ${shutdownTimeoutMs}ms`)
        processRef.exit?.(1)
      }, shutdownTimeoutMs)

      timeout.unref?.()

      try {
        logger.info(`Received ${signal}; shutting down`)

        await closeSocketServer(io)
        await closeHttpServer(server)
        await prisma.$disconnect()
        processRef.exitCode = 0
        logger.info('Graceful shutdown complete')
      } catch (error) {
        processRef.exitCode = 1
        logger.error('Graceful shutdown failed', error)
      } finally {
        timers.clearTimeout(timeout)
      }
    })()

    return shutdownPromise
  }
}

const registerGracefulShutdown = ({
  processRef = process,
  signals = SHUTDOWN_SIGNALS,
  ...dependencies
}) => {
  const shutdown = createGracefulShutdown({ processRef, ...dependencies })
  const handlers = new Map()

  signals.forEach((signal) => {
    const handler = () => {
      shutdown(signal)
    }

    handlers.set(signal, handler)
    processRef.once(signal, handler)
  })

  return {
    shutdown,
    unregister: () => {
      handlers.forEach((handler, signal) => {
        processRef.off?.(signal, handler)
      })
    },
  }
}

module.exports = {
  createGracefulShutdown,
  registerGracefulShutdown,
}
