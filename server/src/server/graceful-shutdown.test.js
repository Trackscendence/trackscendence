const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { describe, it } = require('node:test')

const {
  createGracefulShutdown,
  registerGracefulShutdown,
} = require('./graceful-shutdown')

const createLogger = () => {
  const logs = []

  return {
    logger: {
      error: (...args) => logs.push(['error', ...args]),
      info: (...args) => logs.push(['info', ...args]),
    },
    logs,
  }
}

const createProcessRef = () => {
  const events = new EventEmitter()

  return {
    emit: events.emit.bind(events),
    exitCode: undefined,
    off: events.off.bind(events),
    once: events.once.bind(events),
  }
}

const createTimers = () => {
  const timeouts = new Set()

  return {
    clearTimeout: (timeout) => {
      timeouts.delete(timeout)
    },
    pendingCount: () => timeouts.size,
    setTimeout: () => {
      const timeout = {
        unref: () => {},
      }

      timeouts.add(timeout)
      return timeout
    },
  }
}

describe('createGracefulShutdown', () => {
  it('closes sockets and disconnects Prisma on shutdown', async () => {
    const { logger } = createLogger()
    const processRef = createProcessRef()
    const timers = createTimers()
    const events = []
    const shutdown = createGracefulShutdown({
      io: {
        close: (callback) => {
          events.push('io.close')
          callback()
        },
      },
      logger,
      prisma: {
        $disconnect: async () => {
          events.push('prisma.disconnect')
        },
      },
      processRef,
      server: {
        close: (callback) => {
          events.push('server.close')
          callback()
        },
        listening: true,
      },
      timers,
    })

    await shutdown('SIGTERM')

    assert.deepStrictEqual(events, [
      'io.close',
      'server.close',
      'prisma.disconnect',
    ])
    assert.equal(processRef.exitCode, 0)
    assert.equal(timers.pendingCount(), 0)
  })

  it('runs shutdown work only once for duplicate signals', async () => {
    const { logger } = createLogger()
    const processRef = createProcessRef()
    const timers = createTimers()
    let releaseClose
    let disconnectCount = 0
    const shutdown = createGracefulShutdown({
      io: {
        close: (callback) => {
          releaseClose = callback
        },
      },
      logger,
      prisma: {
        $disconnect: async () => {
          disconnectCount += 1
        },
      },
      processRef,
      server: {
        close: (callback) => callback(),
        listening: true,
      },
      timers,
    })

    const firstShutdown = shutdown('SIGTERM')
    const secondShutdown = shutdown('SIGINT')

    releaseClose()
    await Promise.all([firstShutdown, secondShutdown])

    assert.equal(disconnectCount, 1)
    assert.equal(processRef.exitCode, 0)
  })

  it('sets a failing exit code when cleanup fails', async () => {
    const { logger, logs } = createLogger()
    const processRef = createProcessRef()
    const timers = createTimers()
    const shutdown = createGracefulShutdown({
      logger,
      prisma: {
        $disconnect: async () => {
          throw new Error('database disconnect failed')
        },
      },
      processRef,
      server: {
        close: (callback) => callback(),
        listening: true,
      },
      timers,
    })

    await shutdown('SIGTERM')

    assert.equal(processRef.exitCode, 1)
    assert.equal(timers.pendingCount(), 0)
    assert.match(logs.at(-1)[1], /Graceful shutdown failed/)
  })
})

describe('registerGracefulShutdown', () => {
  it('registers signal handlers and can unregister them', async () => {
    const { logger } = createLogger()
    const processRef = createProcessRef()
    const timers = createTimers()
    let disconnectCount = 0
    const { unregister } = registerGracefulShutdown({
      logger,
      prisma: {
        $disconnect: async () => {
          disconnectCount += 1
        },
      },
      processRef,
      server: {
        close: (callback) => callback(),
        listening: true,
      },
      signals: ['SIGTERM'],
      timers,
    })

    unregister()
    processRef.emit('SIGTERM')

    assert.equal(disconnectCount, 0)
    assert.equal(processRef.exitCode, undefined)
  })
})
