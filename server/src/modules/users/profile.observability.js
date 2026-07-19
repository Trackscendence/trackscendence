const { randomUUID } = require('node:crypto')

const startTimer = () => process.hrtime.bigint()

const finishTimer = (startedAt) => {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6

  return Number(durationMs.toFixed(2))
}

const measureAsyncTiming = async (timings, key, work) => {
  const startedAt = startTimer()
  const result = await work()

  if (timings) {
    timings[key] = finishTimer(startedAt)
  }

  return result
}

const resolveCorrelationId = (rawCorrelationId) => {
  if (typeof rawCorrelationId !== 'string') {
    return randomUUID()
  }

  const correlationId = rawCorrelationId.trim()

  if (!correlationId) {
    return randomUUID()
  }

  return correlationId.slice(0, 120)
}

const shouldLogProfileAssembly = (logger) => {
  if (!logger || typeof logger.debug !== 'function') {
    return false
  }

  if (typeof logger.isLevelEnabled === 'function') {
    return logger.isLevelEnabled('debug')
  }

  return true
}

const logProfileAssembly = ({
  correlationId,
  logger,
  profileRead,
  profileUserId,
  timings,
  viewerId = null,
}) => {
  if (!shouldLogProfileAssembly(logger)) {
    return
  }

  logger.debug('Profile view assembled', {
    correlationId,
    durationsMs: timings,
    profileRead,
    profileUserId,
    viewerId,
  })
}

module.exports = {
  finishTimer,
  logProfileAssembly,
  measureAsyncTiming,
  resolveCorrelationId,
  startTimer,
}
