const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const express = require('express')
const adminRouter = require('#modules/admin/admin.routes')
const authService = require('#modules/auth/auth.service')
const { errorHandler } = require('#middleware/error.middleware')

const originalGetAuthenticatedUser = authService.getAuthenticatedUser

afterEach(() => {
  authService.getAuthenticatedUser = originalGetAuthenticatedUser
})

const requestAccess = async (user) => {
  authService.getAuthenticatedUser = async () => user

  const app = express()
  app.use('/admin', adminRouter)
  app.use(errorHandler)

  const server = app.listen(0)

  try {
    const { port } = server.address()
    return await fetch(`http://127.0.0.1:${port}/admin/access`, {
      headers: { authorization: 'Bearer test-token' },
    })
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

test('admin routes reject non-admin users', async () => {
  const response = await requestAccess({ id: 1, role: 'USER' })

  assert.equal(response.status, 403)
})

test('admin routes allow admin users', async () => {
  const response = await requestAccess({
    id: 2,
    email: 'admin@example.com',
    username: 'admin',
    role: 'ADMIN',
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    message: 'Admin access granted',
    user: {
      id: 2,
      email: 'admin@example.com',
      username: 'admin',
      role: 'ADMIN',
    },
  })
})
