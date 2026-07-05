const assert = require('node:assert/strict')
const test = require('node:test')
const ForbiddenException = require('#exceptions/forbidden.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const { requireRole } = require('#middleware/auth.middleware')

test('requireRole rejects unauthenticated requests', () => {
  const middleware = requireRole('ADMIN')
  let forwardedError = null

  middleware({}, {}, (error) => {
    forwardedError = error
  })

  assert.ok(forwardedError instanceof UnauthorizedException)
  assert.equal(forwardedError.message, 'Authentication required')
})

test('requireRole rejects authenticated users without the required role', () => {
  const middleware = requireRole('ADMIN')
  let forwardedError = null

  middleware(
    {
      user: {
        id: 1,
        role: 'USER',
      },
    },
    {},
    (error) => {
      forwardedError = error
    },
  )

  assert.ok(forwardedError instanceof ForbiddenException)
  assert.equal(forwardedError.message, 'Insufficient permissions')
})

test('requireRole allows authenticated users with the required role', () => {
  const middleware = requireRole('ADMIN')
  let nextCalls = 0
  let forwardedError = null

  middleware(
    {
      user: {
        id: 1,
        role: 'ADMIN',
      },
    },
    {},
    (error) => {
      forwardedError = error ?? null
      nextCalls += 1
    },
  )

  assert.equal(forwardedError, null)
  assert.equal(nextCalls, 1)
})
