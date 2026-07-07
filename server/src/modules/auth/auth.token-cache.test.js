const assert = require('node:assert/strict')
const { describe, it, beforeEach } = require('node:test')
const { setTimeout: sleep } = require('node:timers/promises')

// Pin a short TTL and a tiny bound before the module (and config) load, so the
// expiry and eviction paths are testable deterministically.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.AUTH_CACHE_TTL_MS = '60'
process.env.AUTH_CACHE_MAX_ENTRIES = '3'

const tokenCache = require('./auth.token-cache')

describe('auth.token-cache (B4)', () => {
  beforeEach(() => tokenCache.clear())

  it('returns a stored entry with its tokenVersion and user', () => {
    tokenCache.set(1, 4, { id: 1, username: 'a' })
    const entry = tokenCache.get(1)
    assert.equal(entry.tokenVersion, 4)
    assert.deepEqual(entry.user, { id: 1, username: 'a' })
  })

  it('misses after the TTL expires', async () => {
    tokenCache.set(1, 0, { id: 1 })
    assert.ok(tokenCache.get(1))
    await sleep(90)
    assert.equal(tokenCache.get(1), undefined)
  })

  it('invalidate removes the entry', () => {
    tokenCache.set(1, 0, { id: 1 })
    tokenCache.invalidate(1)
    assert.equal(tokenCache.get(1), undefined)
  })

  it('stays bounded, evicting the oldest entries', () => {
    tokenCache.set(1, 0, { id: 1 })
    tokenCache.set(2, 0, { id: 2 })
    tokenCache.set(3, 0, { id: 3 })
    tokenCache.set(4, 0, { id: 4 })
    assert.equal(tokenCache.size(), 3)
    assert.equal(tokenCache.get(1), undefined) // oldest evicted
    assert.ok(tokenCache.get(4))
  })
})
