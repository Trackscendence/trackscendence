const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const gameRepository = require('#modules/game/game.repository')
const {
  buildGameResultPayload,
  getLeaderboard,
  parseLeaderboardQuery,
} = require('#modules/game/game.service')

describe('parseLeaderboardQuery', () => {
  it('returns defaults for an empty query', () => {
    const result = parseLeaderboardQuery({})

    assert.deepStrictEqual(result, {
      page: 1,
      limit: 10,
      search: '',
      minGames: 0,
      sort: 'wins',
      order: 'desc',
    })
  })

  it('accepts every whitelisted sort field', () => {
    for (const sort of ['wins', 'totalScore', 'gamesPlayed', 'winRate']) {
      assert.strictEqual(parseLeaderboardQuery({ sort }).sort, sort)
    }
  })

  it('trims the search term', () => {
    const result = parseLeaderboardQuery({ search: '  sergio  ' })

    assert.strictEqual(result.search, 'sergio')
  })

  it('parses minGames and ascending order', () => {
    const result = parseLeaderboardQuery({ minGames: '5', order: 'asc' })

    assert.strictEqual(result.minGames, 5)
    assert.strictEqual(result.order, 'asc')
  })

  it('clamps limit to the maximum page size', () => {
    const result = parseLeaderboardQuery({ limit: '500' })

    assert.strictEqual(result.limit, 50)
  })

  it('clamps page to the maximum page number', () => {
    const result = parseLeaderboardQuery({ page: '99999' })

    assert.strictEqual(result.page, 1000)
  })

  it('rejects a non-whitelisted sort field', () => {
    assert.throws(() => parseLeaderboardQuery({ sort: 'passwordHash' }), {
      statusCode: 400,
    })
  })

  it('rejects an invalid order', () => {
    assert.throws(() => parseLeaderboardQuery({ order: 'sideways' }), {
      statusCode: 400,
    })
  })

  it('rejects a negative minGames', () => {
    assert.throws(() => parseLeaderboardQuery({ minGames: '-1' }), {
      statusCode: 400,
    })
  })

  it('rejects a search term over 50 characters', () => {
    assert.throws(() => parseLeaderboardQuery({ search: 'a'.repeat(51) }), {
      statusCode: 400,
    })
  })

  it('rejects a repeated search parameter', () => {
    assert.throws(() => parseLeaderboardQuery({ search: ['a', 'b'] }), {
      statusCode: 400,
    })
  })

  it('collects every violation into one error', () => {
    try {
      parseLeaderboardQuery({ page: '0', sort: 'nope', order: 'nope' })
      assert.fail('expected parseLeaderboardQuery to throw')
    } catch (error) {
      assert.strictEqual(error.statusCode, 400)
      assert.strictEqual(error.payload.details.length, 3)
    }
  })
})

describe('getLeaderboard', () => {
  it('honors limit=5 so the profile leaderboard fetch stays bounded', async () => {
    const originalGetLeaderboard = gameRepository.getLeaderboard
    const originalCount = gameRepository.countLeaderboardPlayers
    let capturedLimit

    gameRepository.getLeaderboard = async ({ limit }) => {
      capturedLimit = limit

      // The repository clamps rows to the requested page size; emulate a full page.
      return Array.from({ length: limit }, (_, index) => ({
        userId: index + 1,
        username: `player${index + 1}`,
        displayName: null,
        totalWins: 0,
        totalScore: 0,
        gamesPlayed: 0,
        winRate: 0,
      }))
    }
    gameRepository.countLeaderboardPlayers = async () => 25

    try {
      const result = await getLeaderboard({ limit: '5' })

      assert.strictEqual(capturedLimit, 5)
      assert.strictEqual(result.pagination.limit, 5)
      assert.ok(result.leaderboard.length <= 5)
      assert.strictEqual(result.leaderboard.length, 5)
    } finally {
      gameRepository.getLeaderboard = originalGetLeaderboard
      gameRepository.countLeaderboardPlayers = originalCount
    }
  })
})

describe('buildGameResultPayload', () => {
  const startedAt = new Date('2026-07-05T10:00:00Z')
  const endedAt = new Date('2026-07-05T10:12:00Z')
  const players = [
    { userId: 1, username: 'alice' },
    { userId: 2, username: 'bob' },
  ]

  it('flags exactly the recorded winner on a completed game', () => {
    const payload = buildGameResultPayload({
      status: 'COMPLETED',
      winner: 2,
      players,
      startedAt,
      endedAt,
    })

    assert.deepStrictEqual(payload, {
      startedAt,
      endedAt,
      status: 'COMPLETED',
      players: [
        { userId: 1, score: 0, isWinner: false },
        { userId: 2, score: 0, isWinner: true },
      ],
    })
  })

  it('flags nobody on an abandoned game', () => {
    const payload = buildGameResultPayload({
      status: 'ABANDONED',
      abandonedBy: 1,
      players,
      startedAt,
      endedAt,
    })

    assert.strictEqual(payload.status, 'ABANDONED')
    assert.ok(payload.players.every((player) => player.isWinner === false))
  })

  it('ignores a leftover winner on an abandoned game', () => {
    const payload = buildGameResultPayload({
      status: 'ABANDONED',
      winner: 2,
      players,
      startedAt,
      endedAt,
    })

    assert.ok(payload.players.every((player) => player.isWinner === false))
  })

  it('carries the engine scores onto each player (#197)', () => {
    const payload = buildGameResultPayload({
      status: 'COMPLETED',
      winner: 2,
      scores: { 1: 0, 2: 42 },
      players,
      startedAt,
      endedAt,
    })

    assert.deepStrictEqual(payload.players, [
      { userId: 1, score: 0, isWinner: false },
      { userId: 2, score: 42, isWinner: true },
    ])
  })
})
