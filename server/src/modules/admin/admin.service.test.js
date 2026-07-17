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
