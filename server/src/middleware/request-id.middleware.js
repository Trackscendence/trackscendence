const { randomUUID } = require('node:crypto')

const REQUEST_ID_HEADER = 'x-request-id'
const MAX_REQUEST_ID_LENGTH = 120

const resolveRequestId = (rawRequestId) => {
  if (typeof rawRequestId !== 'string') {
    return randomUUID()
  }

  const requestId = rawRequestId.trim()

  if (!requestId) {
    return randomUUID()
  }

  return requestId.slice(0, MAX_REQUEST_ID_LENGTH)
}

const attachRequestId = (req, res, next) => {
  const requestId = resolveRequestId(req.get?.(REQUEST_ID_HEADER))

  req.requestId = requestId
  res.setHeader(REQUEST_ID_HEADER, requestId)
  next()
}

module.exports = {
  attachRequestId,
  MAX_REQUEST_ID_LENGTH,
  REQUEST_ID_HEADER,
  resolveRequestId,
}
