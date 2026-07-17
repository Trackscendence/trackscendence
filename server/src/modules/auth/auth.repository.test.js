const assert = require('node:assert/strict')
const { test } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const authRepository = require('#modules/auth/auth.repository')

test('concurrent allowlist promotion increments and audits once', async () => {
  const user = {
    id: 12,
    role: 'USER',
    tokenVersion: 0,
    deletedAt: null,
  }
  let auditCount = 0
  const tx = {
    user: {
      updateMany: async ({ where }) => {
        if (
          user.id !== where.id ||
          user.role !== where.role ||
          user.deletedAt !== where.deletedAt
        ) {
          return { count: 0 }
        }

        user.role = 'ADMIN'
        user.tokenVersion += 1
        return { count: 1 }
      },
      findUnique: async () => ({ ...user }),
    },
    adminAuditLog: {
      create: async () => {
        auditCount += 1
      },
    },
  }
  const database = { $transaction: (operation) => operation(tx) }

  const results = await Promise.all([
    authRepository.promoteAllowlistedAdmin(12, database),
    authRepository.promoteAllowlistedAdmin(12, database),
  ])

  assert.deepEqual(
    results.map((result) => result.role),
    ['ADMIN', 'ADMIN'],
  )
  assert.equal(user.tokenVersion, 1)
  assert.equal(auditCount, 1)
})
