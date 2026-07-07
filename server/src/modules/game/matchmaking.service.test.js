const { afterEach, mock, test } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const matchmakingService = require('#modules/game/matchmaking.service')
const gameStore = require('#modules/game/game.store')
const gameService = require('#modules/game/game.service')

afterEach(() => mock.restoreAll())

test('handlePlayerDisconnect removes abandoned games from the in-memory store', async () => {
  const game = {
    id: 'game-1',
    status: 'IN_PROGRESS',
    players: [{ userId: 7, username: 'player' }],
    startedAt: new Date('2026-07-07T00:00:00Z'),
  }
  const calls = []

  mock.method(gameStore, 'findActiveGameByUser', async () => game)
  mock.method(gameStore, 'saveGame', async (gameId, state) => {
    calls.push(['saveGame', gameId, state.status])
  })
  mock.method(gameStore, 'deleteEngine', (gameId) => {
    calls.push(['deleteEngine', gameId])
  })
  mock.method(gameService, 'persistGameResult', async (state) => {
    calls.push(['persistGameResult', state.id, state.status])
  })
  mock.method(gameStore, 'deleteGame', async (gameId) => {
    calls.push(['deleteGame', gameId])
  })

  const result = await matchmakingService.handlePlayerDisconnect(7)

  assert.equal(result, game)
  assert.equal(game.status, 'ABANDONED')
  assert.equal(game.abandonedBy, 7)
  assert.deepEqual(calls, [
    ['saveGame', 'game-1', 'ABANDONED'],
    ['deleteEngine', 'game-1'],
    ['persistGameResult', 'game-1', 'ABANDONED'],
    ['deleteGame', 'game-1'],
  ])
})
