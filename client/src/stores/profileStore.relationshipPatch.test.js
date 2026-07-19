import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyFriendRequestResponsePatch,
  applyRelationshipRemovalPatch,
} from './profileStore.relationshipPatch.js'

const baseState = () => ({
  currentProfile: {
    id: 1,
    username: 'me',
    stats: { friendsCount: 8, wins: 5 },
    friends: [{ user: { id: 2 } }],
  },
  publicProfile: {
    id: 2,
    username: 'friend',
    stats: { friendsCount: 14, wins: 7 },
    friends: [{ user: { id: 1 } }],
  },
  relationship: { status: 'PENDING_INCOMING' },
})

test('accepting a request increments both cached profile totals from stats, not the preview list', () => {
  const state = baseState()

  const patch = applyFriendRequestResponsePatch({
    action: 'accept',
    relationship: { status: 'FRIENDS' },
    state,
  })

  assert.equal(patch.relationship.status, 'FRIENDS')
  assert.equal(patch.currentProfile.stats.friendsCount, 9)
  assert.equal(patch.publicProfile.stats.friendsCount, 15)
  // The totals come from stats, not from the capped preview arrays.
  assert.equal(patch.currentProfile.friends.length, 1)
  assert.equal(patch.publicProfile.friends.length, 1)
  assert.equal(state.currentProfile.stats.friendsCount, 8)
  assert.equal(state.publicProfile.stats.friendsCount, 14)
})

test('rejecting a request does not change accepted-friend totals', () => {
  const state = baseState()

  const patch = applyFriendRequestResponsePatch({
    action: 'reject',
    relationship: null,
    state,
  })

  assert.equal(patch.relationship, null)
  assert.equal('currentProfile' in patch, false)
  assert.equal('publicProfile' in patch, false)
  assert.equal(state.currentProfile.stats.friendsCount, 8)
  assert.equal(state.publicProfile.stats.friendsCount, 14)
})

test('removing an accepted friendship decrements both cached totals', () => {
  const state = baseState()

  const patch = applyRelationshipRemovalPatch({
    relationship: null,
    state,
    wasFriends: true,
  })

  assert.equal(patch.relationship, null)
  assert.equal(patch.currentProfile.stats.friendsCount, 7)
  assert.equal(patch.publicProfile.stats.friendsCount, 13)
  assert.equal(state.currentProfile.stats.friendsCount, 8)
  assert.equal(state.publicProfile.stats.friendsCount, 14)
})

test('cancelling a pending request leaves accepted-friend totals untouched', () => {
  const state = baseState()

  const patch = applyRelationshipRemovalPatch({
    relationship: null,
    state,
    wasFriends: false,
  })

  assert.equal(patch.relationship, null)
  assert.equal('currentProfile' in patch, false)
  assert.equal('publicProfile' in patch, false)
  assert.equal(state.currentProfile.stats.friendsCount, 8)
  assert.equal(state.publicProfile.stats.friendsCount, 14)
})
