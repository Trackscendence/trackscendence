const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const { parseLeaderboardQuery } = require('#modules/game/game.service')

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
