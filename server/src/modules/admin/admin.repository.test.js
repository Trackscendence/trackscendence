const assert = require('node:assert/strict')
const { test } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const adminRepository = require('#modules/admin/admin.repository')

const buildUser = (overrides = {}) => ({
  id: 12,
  username: 'target',
  displayName: 'Target User',
  email: 'target@example.com',
  avatarUrl: null,
  role: 'USER',
  status: 'ACTIVE',
  suspendedUntil: null,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  gamesPlayed: 2,
  wins: 1,
  ...overrides,
})

const transactionDatabase = (tx) => ({
  $transaction: (operation, options) => {
    assert.deepEqual(options, { isolationLevel: 'Serializable' })
    return operation(tx)
  },
})

test('changeUserRole writes the role, token bump, and audit atomically', async () => {
  const writes = []
  const target = buildUser()
  const tx = {
    user: {
      findFirst: async () => target,
      update: async (query) => {
        writes.push(['user', query])
        return { ...target, role: 'ADMIN' }
      },
      count: async () => assert.fail('promotion must not count administrators'),
    },
    adminAuditLog: {
      create: async (query) => writes.push(['audit', query]),
    },
  }

  const result = await adminRepository.changeUserRole(
    1,
    12,
    'ADMIN',
    transactionDatabase(tx),
  )

  assert.equal(result.user.role, 'ADMIN')
  assert.deepEqual(writes[0][1].data, {
    role: 'ADMIN',
    tokenVersion: { increment: 1 },
  })
  assert.equal(writes[1][1].data.action, 'ROLE_CHANGED')
})

test('changeUserRole protects the last administrator before any write', async () => {
  const tx = {
    user: {
      findFirst: async () => buildUser({ role: 'ADMIN' }),
      count: async () => 1,
      update: async () => assert.fail('last administrator must not be updated'),
    },
    adminAuditLog: {
      create: async () => assert.fail('must not audit a rejection'),
    },
  }

  assert.deepEqual(
    await adminRepository.changeUserRole(
      1,
      12,
      'USER',
      transactionDatabase(tx),
    ),
    { error: adminRepository.ADMIN_MUTATION_ERRORS.LAST_ADMIN },
  )
})

test('moderateUser audits every supported status transition', async () => {
  const cases = [
    ['SUSPENDED', 'USER_SUSPENDED', new Date('2026-07-18T00:00:00.000Z')],
    ['BANNED', 'USER_BANNED', null],
    ['ACTIVE', 'USER_REINSTATED', null],
  ]

  for (const [status, action, suspendedUntil] of cases) {
    let audit = null
    const tx = {
      user: {
        findFirst: async () => buildUser(),
        update: async ({ data }) => buildUser({ status: data.status }),
      },
      adminAuditLog: { create: async (query) => (audit = query.data) },
    }

    const result = await adminRepository.moderateUser(
      1,
      12,
      { status, action, reason: 'reason', suspendedUntil },
      transactionDatabase(tx),
    )

    assert.equal(result.user.status, status)
    assert.equal(audit.action, action)
    assert.equal(audit.actorId, 1)
    assert.equal(audit.targetId, 12)
  }
})

test('deleteUser audits a soft delete', async () => {
  let update = null
  let audit = null
  const user = buildUser()
  const tx = {
    user: {
      findFirst: async () => user,
      update: async (query) => (update = query),
      count: async () =>
        assert.fail('regular-user deletion must not count admins'),
    },
    adminAuditLog: { create: async (query) => (audit = query) },
  }

  const result = await adminRepository.deleteUser(
    1,
    12,
    transactionDatabase(tx),
  )

  assert.ok(result.user.deletedAt instanceof Date)
  assert.ok(update.data.deletedAt instanceof Date)
  assert.deepEqual(update.data.tokenVersion, { increment: 1 })
  assert.equal(audit.data.action, 'USER_DELETED')
})

test('deleteUser protects the last administrator before any write', async () => {
  const tx = {
    user: {
      findFirst: async () => buildUser({ role: 'ADMIN' }),
      count: async () => 1,
      update: async () => assert.fail('last administrator must not be deleted'),
    },
    adminAuditLog: {
      create: async () => assert.fail('must not audit a rejection'),
    },
  }

  assert.deepEqual(
    await adminRepository.deleteUser(1, 12, transactionDatabase(tx)),
    { error: adminRepository.ADMIN_MUTATION_ERRORS.LAST_ADMIN },
  )
})

test('mutations return null for missing or already-deleted users', async () => {
  const tx = {
    user: {
      findFirst: async () => null,
      update: async () => assert.fail('missing user must not be updated'),
    },
    adminAuditLog: {
      create: async () => assert.fail('missing user must not be audited'),
    },
  }
  const database = transactionDatabase(tx)

  assert.equal(
    await adminRepository.changeUserRole(1, 99, 'ADMIN', database),
    null,
  )
  assert.equal(
    await adminRepository.moderateUser(
      1,
      99,
      {
        status: 'BANNED',
        reason: 'reason',
        suspendedUntil: null,
        action: 'USER_BANNED',
      },
      database,
    ),
    null,
  )
  assert.equal(await adminRepository.deleteUser(1, 99, database), null)
})

test('serializable mutations retry transaction conflicts', async () => {
  let attempts = 0
  const database = {
    $transaction: async (operation) => {
      attempts += 1
      if (attempts < 3) {
        const error = new Error('serialization conflict')
        error.code = 'P2034'
        throw error
      }
      return operation({
        user: { findFirst: async () => buildUser({ role: 'ADMIN' }) },
      })
    },
  }

  const result = await adminRepository.changeUserRole(1, 12, 'ADMIN', database)

  assert.equal(result.user.role, 'ADMIN')
  assert.equal(attempts, 3)
})
