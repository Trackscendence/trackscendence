const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const { parseUserSearchQuery } = require('#modules/users/users.service')

describe('parseUserSearchQuery', () => {
  it('trims the term and returns pagination defaults', () => {
    const result = parseUserSearchQuery({ q: '  sergio  ' })

    assert.deepStrictEqual(result, { q: 'sergio', page: 1, limit: 10 })
  })

  it('parses explicit page and limit', () => {
    const result = parseUserSearchQuery({ q: 'ser', page: '3', limit: '25' })

    assert.deepStrictEqual(result, { q: 'ser', page: 3, limit: 25 })
  })

  it('clamps limit to the maximum page size', () => {
    const result = parseUserSearchQuery({ q: 'ser', limit: '500' })

    assert.strictEqual(result.limit, 50)
  })

  it('rejects a missing term', () => {
    assert.throws(() => parseUserSearchQuery({}), { statusCode: 400 })
  })

  it('rejects a whitespace-only term', () => {
    assert.throws(() => parseUserSearchQuery({ q: '   ' }), {
      statusCode: 400,
    })
  })

  it('rejects a repeated q parameter', () => {
    assert.throws(() => parseUserSearchQuery({ q: ['a', 'b'] }), {
      statusCode: 400,
    })
  })

  it('rejects a term over 50 characters', () => {
    assert.throws(() => parseUserSearchQuery({ q: 'a'.repeat(51) }), {
      statusCode: 400,
    })
  })

  it('rejects an invalid page', () => {
    assert.throws(() => parseUserSearchQuery({ q: 'ser', page: '0' }), {
      statusCode: 400,
    })
  })
})
