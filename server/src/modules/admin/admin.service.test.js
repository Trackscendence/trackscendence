const assert = require('node:assert/strict')
const { test } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const adminService = require('#modules/admin/admin.service')

test('getStats combines database aggregates with in-memory active games', async () => {
  const databaseStats = {
    totalPlayers: 12,
    openRooms: 2,
    gamesToday: 4,
    gamesThisWeek: [{ day: '2026-07-17', count: 4 }],
    newPlayersThisWeek: [{ day: '2026-07-17', count: 1 }],
  }

  const result = await adminService.getStats({
    repository: { getStats: async () => databaseStats },
    store: {
      getAllGames: async () => [
        { id: 'one', status: 'IN_PROGRESS' },
        { id: 'two', status: 'COMPLETED' },
        { id: 'three', status: 'IN_PROGRESS' },
      ],
    },
  })

  assert.deepEqual(result, {
    stats: {
      ...databaseStats,
      activeGames: 2,
      openReports: 0,
    },
  })
})

test('listUsers validates filters and returns bounded pagination', async () => {
  let receivedFilters = null
  const users = [{ id: 12, username: 'ada' }]
  const result = await adminService.listUsers(
    { q: ' ada ', status: 'ACTIVE', role: 'USER', page: '2', limit: '200' },
    {
      repository: {
        listUsers: async (filters) => {
          receivedFilters = filters
          return { users, totalCount: 61 }
        },
      },
    },
  )

  assert.deepEqual(receivedFilters, {
    query: 'ada',
    status: 'ACTIVE',
    role: 'USER',
    page: 2,
    limit: 50,
    offset: 50,
  })
  assert.deepEqual(result, {
    users,
    pagination: { page: 2, limit: 50, totalCount: 61 },
  })
})

test('listUsers rejects invalid enum filters and pagination', async () => {
  await assert.rejects(
    () =>
      adminService.listUsers({
        status: 'LOCKED',
        role: 'OWNER',
        page: 'zero',
      }),
    (error) => {
      assert.equal(error.statusCode, 400)
      assert.equal(error.payload.details.length, 3)
      return true
    },
  )
})

test('getUser maps the recent targeted audit trail onto the contract', async () => {
  const auditLog = [
    {
      id: 3,
      action: 'USER_SUSPENDED',
      reason: 'abusive chat',
      actor: { id: 1, username: 'operator' },
    },
  ]
  const result = await adminService.getUser('12', {
    repository: {
      findUserDetail: async (id) => {
        assert.equal(id, 12)
        return {
          id,
          username: 'ada',
          adminAuditLogsTargeted: auditLog,
        }
      },
    },
  })

  assert.deepEqual(result, {
    user: {
      id: 12,
      username: 'ada',
      reportsCount: 0,
      auditLog,
    },
  })
})

test('getUser rejects malformed and missing user ids', async () => {
  await assert.rejects(() => adminService.getUser('abc'), { statusCode: 400 })
  await assert.rejects(
    () =>
      adminService.getUser('99', {
        repository: { findUserDetail: async () => null },
      }),
    { statusCode: 404 },
  )
})

test('changeUserRole invalidates live auth after the audited write', async () => {
  let invalidatedId = null
  const result = await adminService.changeUserRole(
    1,
    '12',
    { role: 'ADMIN' },
    {
      repository: {
        ADMIN_MUTATION_ERRORS: { LAST_ADMIN: 'LAST_ADMIN' },
        changeUserRole: async (actorId, targetId, role) => {
          assert.deepEqual(
            { actorId, targetId, role },
            {
              actorId: 1,
              targetId: 12,
              role: 'ADMIN',
            },
          )
          return { user: { id: 12, role, tokenVersion: 4 } }
        },
      },
      tokenCache: { invalidate: (id) => (invalidatedId = id) },
    },
  )

  assert.deepEqual(result, { user: { id: 12, role: 'ADMIN' } })
  assert.equal(invalidatedId, 12)
})

test('changeUserRole protects the last administrator', async () => {
  await assert.rejects(
    () =>
      adminService.changeUserRole(
        1,
        '1',
        { role: 'USER' },
        {
          repository: {
            ADMIN_MUTATION_ERRORS: { LAST_ADMIN: 'LAST_ADMIN' },
            changeUserRole: async () => ({ error: 'LAST_ADMIN' }),
          },
        },
      ),
    { statusCode: 409 },
  )
})

test('suspendUser validates a future expiry and invalidates auth', async () => {
  let mutation = null
  let invalidatedId = null
  const suspendedUntil = new Date(Date.now() + 60_000).toISOString()
  const result = await adminService.suspendUser(
    1,
    '12',
    { suspendedUntil, reason: ' abusive chat ' },
    {
      repository: {
        moderateUser: async (actorId, targetId, input) => {
          mutation = { actorId, targetId, input }
          return { user: { id: targetId, status: input.status } }
        },
      },
      tokenCache: { invalidate: (id) => (invalidatedId = id) },
    },
  )

  assert.equal(mutation.input.reason, 'abusive chat')
  assert.equal(mutation.input.action, 'USER_SUSPENDED')
  assert.equal(mutation.input.suspendedUntil.toISOString(), suspendedUntil)
  assert.deepEqual(result, { user: { id: 12, status: 'SUSPENDED' } })
  assert.equal(invalidatedId, 12)
})

test('moderation rejects self-actions, expired suspensions, and empty reasons', async () => {
  await assert.rejects(
    () =>
      adminService.banUser(
        1,
        '1',
        { reason: 'reason' },
        {
          repository: { moderateUser: async () => assert.fail() },
        },
      ),
    { statusCode: 409 },
  )
  await assert.rejects(
    () =>
      adminService.suspendUser(1, '2', {
        suspendedUntil: new Date(Date.now() - 60_000).toISOString(),
        reason: 'reason',
      }),
    { statusCode: 400 },
  )
  assert.throws(() => adminService.banUser(1, '2', { reason: ' ' }), {
    statusCode: 400,
  })
})

test('reinstateUser clears moderation state through the shared write path', async () => {
  let receivedMutation = null
  await adminService.reinstateUser(1, '12', {
    repository: {
      moderateUser: async (actorId, targetId, mutation) => {
        receivedMutation = mutation
        return { user: { id: targetId, status: mutation.status } }
      },
    },
    tokenCache: { invalidate: () => {} },
  })

  assert.deepEqual(receivedMutation, {
    status: 'ACTIVE',
    reason: null,
    suspendedUntil: null,
    action: 'USER_REINSTATED',
  })
})
