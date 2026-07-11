import assert from 'node:assert/strict'
import test from 'node:test'
import { withFriendsCountDelta } from './profileStore.friendsCount.js'

test('increments the cached friends count without mutating the profile', () => {
  const profile = { id: 7, stats: { friendsCount: 2, wins: 5 } }

  const updated = withFriendsCountDelta(profile, 1)

  assert.equal(updated.stats.friendsCount, 3)
  assert.equal(updated.stats.wins, 5)
  assert.equal(profile.stats.friendsCount, 2)
  assert.notEqual(updated, profile)
})

test('decrements but never drops below zero', () => {
  const profile = { id: 7, stats: { friendsCount: 0 } }

  assert.equal(withFriendsCountDelta(profile, -1).stats.friendsCount, 0)
})

test('treats a missing count as zero', () => {
  const profile = { id: 7, stats: {} }

  assert.equal(withFriendsCountDelta(profile, 1).stats.friendsCount, 1)
})

test('passes through profiles that are not loaded', () => {
  assert.equal(withFriendsCountDelta(null, 1), null)
  assert.equal(withFriendsCountDelta(undefined, -1), undefined)

  const missingStats = { id: 7 }
  assert.equal(withFriendsCountDelta(missingStats, 1), missingStats)
})
