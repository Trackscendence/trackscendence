const assert = require('node:assert/strict')
const test = require('node:test')
const {
  attachRequestId,
  MAX_REQUEST_ID_LENGTH,
  REQUEST_ID_HEADER,
} = require('#middleware/request-id.middleware')

test('attachRequestId reuses the incoming request id and echoes it back', () => {
  const headers = new Map()
  const req = {
    get: (header) =>
      header === REQUEST_ID_HEADER ? '  profile-read-123  ' : undefined,
  }
  const res = {
    setHeader: (key, value) => headers.set(key, value),
  }
  let nextCalls = 0

  attachRequestId(req, res, () => {
    nextCalls += 1
  })

  assert.equal(req.requestId, 'profile-read-123')
  assert.equal(headers.get(REQUEST_ID_HEADER), 'profile-read-123')
  assert.equal(nextCalls, 1)
})

test('attachRequestId generates a request id when the header is missing', () => {
  const headers = new Map()
  const req = {
    get: () => undefined,
  }
  const res = {
    setHeader: (key, value) => headers.set(key, value),
  }

  attachRequestId(req, res, () => {})

  assert.equal(typeof req.requestId, 'string')
  assert.ok(req.requestId.length > 0)
  assert.equal(headers.get(REQUEST_ID_HEADER), req.requestId)
})

test('attachRequestId trims overlong request ids to the maximum length', () => {
  const providedRequestId = 'a'.repeat(MAX_REQUEST_ID_LENGTH + 25)
  const headers = new Map()
  const req = {
    get: () => providedRequestId,
  }
  const res = {
    setHeader: (key, value) => headers.set(key, value),
  }

  attachRequestId(req, res, () => {})

  assert.equal(req.requestId.length, MAX_REQUEST_ID_LENGTH)
  assert.equal(headers.get(REQUEST_ID_HEADER), req.requestId)
})
