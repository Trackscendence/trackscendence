const config = require('#utils/config')

// Short-TTL, bounded cache of the per-token auth lookup (audit B4). Every HTTP
// request and socket connect resolves the bearer token to a user by reading the
// User row for its tokenVersion; under load (especially the socket-heavy path)
// that is one DB round-trip per event for the same handful of users. This caches
// the resolved safe user alongside the DB tokenVersion so a hit skips the DB.
//
// Correctness rests on two things: (1) every hit re-checks the caller's JWT
// tokenVersion against the cached DB tokenVersion, so a stale token is still
// rejected; (2) the four tokenVersion-bump sites (password change/reset, guest
// upgrade, account deletion) invalidate their entry, so a revoked token cannot
// ride a cache hit. The TTL is the backstop if an invalidation is ever missed,
// and MAX_ENTRIES bounds the map so it cannot grow without limit.

const TTL_MS = config.AUTH_CACHE_TTL_MS
const MAX_ENTRIES = config.AUTH_CACHE_MAX_ENTRIES

// Map<userId, { tokenVersion, user, expiresAt }>. Insertion order gives us a
// cheap LRU-ish eviction: the oldest entry is the first key.
const entries = new Map()

const isEnabled = () => TTL_MS > 0

const get = (userId) => {
  if (!isEnabled()) return undefined
  const entry = entries.get(userId)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    entries.delete(userId)
    return undefined
  }
  return entry
}

const set = (userId, tokenVersion, user) => {
  if (!isEnabled()) return
  // Refresh recency: delete then re-insert so this key moves to the end.
  entries.delete(userId)
  entries.set(userId, { tokenVersion, user, expiresAt: Date.now() + TTL_MS })
  // Bound the map: evict the oldest entries once over capacity.
  while (entries.size > MAX_ENTRIES) {
    const oldestKey = entries.keys().next().value
    entries.delete(oldestKey)
  }
}

const invalidate = (userId) => {
  entries.delete(userId)
}

// Test helpers.
const clear = () => entries.clear()
const size = () => entries.size

module.exports = { get, set, invalidate, clear, size }
