import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import {
  nextSearchToken,
  isCurrentSearchToken,
  invalidateSearchScope,
  resetSearchTokens,
} from './searchRequestTokens.js'

// The token map is a module-level singleton, so reset it between cases the way
// the store's reset() does at session teardown.
beforeEach(() => {
  resetSearchTokens()
})

test('a freshly issued token is the scope current one', () => {
  const token = nextSearchToken('player-search')

  assert.equal(isCurrentSearchToken('player-search', token), true)
})

test('a superseded response cannot commit after a newer request starts', () => {
  const stale = nextSearchToken('player-search')
  const fresh = nextSearchToken('player-search')

  // The slow, older response lands after the newer one already claimed the
  // scope: it must be rejected so it cannot overwrite newer results.
  assert.equal(isCurrentSearchToken('player-search', stale), false)
  assert.equal(isCurrentSearchToken('player-search', fresh), true)
})

test('invalidate drops the in-flight token so a late response is a no-op', () => {
  const token = nextSearchToken('player-search')
  invalidateSearchScope('player-search')

  // Models typing a new long-enough term: visible results stay put, but the
  // request already in flight can no longer commit.
  assert.equal(isCurrentSearchToken('player-search', token), false)
})

test('scopes are independent: clearing one leaves another current', () => {
  const other = nextSearchToken('compose-recipient')
  const cleared = nextSearchToken('profile-header')

  invalidateSearchScope('profile-header')

  assert.equal(isCurrentSearchToken('compose-recipient', other), true)
  assert.equal(isCurrentSearchToken('profile-header', cleared), false)
})

test('reset invalidates every scope in-flight token', () => {
  const a = nextSearchToken('profile-header')
  const b = nextSearchToken('compose-recipient')

  resetSearchTokens()

  assert.equal(isCurrentSearchToken('profile-header', a), false)
  assert.equal(isCurrentSearchToken('compose-recipient', b), false)
})

test('a reissued token for a reused scope never matches a prior one', () => {
  // Regression for the old monotonic-integer ids: after reset those restarted
  // at 1, so a pre-reset response could match a post-reset request's id. Unique
  // Symbols make that collision impossible even when the scope key is reused.
  const before = nextSearchToken('player-search')
  resetSearchTokens()
  const after = nextSearchToken('player-search')

  assert.notEqual(before, after)
  assert.equal(isCurrentSearchToken('player-search', before), false)
  assert.equal(isCurrentSearchToken('player-search', after), true)
})
