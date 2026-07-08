import assert from 'node:assert/strict'
import test from 'node:test'
import { createCurrentProfileLoader } from './profileStore.currentProfileLoader.js'

const emptyFriendContext = {
  friends: [],
  leaderboard: [],
}

// Models the post-fix flow: /users/me is the only critical-path call and it
// carries a seeded friends preview; the full friends list and the leaderboard
// load off the critical path (refreshFriendContext / loadLeaderboard). The calls
// object records which of those the loader reaches.
const createServiceStubs = () => {
  const calls = {
    getProfile: 0,
    refreshFriends: 0,
    leaderboardParams: [],
  }

  const loadCurrentProfileData = async () => {
    calls.getProfile += 1
    return {
      currentProfile: { id: 7, username: 'me' },
      relationship: null,
      friends: [{ user: { id: 1, username: 'seed-friend' } }],
    }
  }

  const loadLeaderboard = async () => {
    calls.leaderboardParams.push({ limit: 5 })
  }

  const refreshFriendContext = async () => {
    calls.refreshFriends += 1
  }

  return {
    calls,
    loadCurrentProfileData,
    loadLeaderboard,
    refreshFriendContext,
  }
}

const stubGet = (stubs) => () => ({
  loadLeaderboard: stubs.loadLeaderboard,
  refreshFriendContext: stubs.refreshFriendContext,
})

test('loads /users/me, seeds the friends preview, and fetches leaderboard + full friends off the critical path', async () => {
  const state = {}
  const stubs = createServiceStubs()

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: stubGet(stubs),
    getAuthUserId: () => 7,
    loadCurrentProfileData: stubs.loadCurrentProfileData,
    now: () => 1000,
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
  })

  await loadCurrentProfile()

  assert.equal(stubs.calls.getProfile, 1)
  assert.equal(stubs.calls.refreshFriends, 1)
  assert.deepEqual(stubs.calls.leaderboardParams, [{ limit: 5 }])
  assert.equal(state.currentProfile.username, 'me')
  // The seeded preview from /users/me lands in state so the sidebar paints
  // before the full friends list arrives.
  assert.deepEqual(state.friends, [
    { user: { id: 1, username: 'seed-friend' } },
  ])
  assert.equal(state.isLoading, false)
})

test('skips a second load, and the off-critical-path fetches, within the freshness window', async () => {
  const state = {}
  const stubs = createServiceStubs()
  let clock = 1000

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: stubGet(stubs),
    getAuthUserId: () => 7,
    loadCurrentProfileData: stubs.loadCurrentProfileData,
    now: () => clock,
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
    ttlMs: 30000,
  })

  await loadCurrentProfile()
  clock += 5000
  await loadCurrentProfile()

  // A cached remount fetches nothing again, including the off-path friends load.
  assert.equal(stubs.calls.getProfile, 1)
  assert.equal(stubs.calls.refreshFriends, 1)
  assert.deepEqual(stubs.calls.leaderboardParams, [{ limit: 5 }])
})

test('reloads past the freshness window and when forced', async () => {
  const state = {}
  const stubs = createServiceStubs()
  let clock = 1000

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: stubGet(stubs),
    getAuthUserId: () => 7,
    loadCurrentProfileData: stubs.loadCurrentProfileData,
    now: () => clock,
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
    ttlMs: 30000,
  })

  await loadCurrentProfile()
  clock += 40000
  await loadCurrentProfile()
  await loadCurrentProfile({ force: true })

  assert.equal(stubs.calls.getProfile, 3)
  assert.equal(stubs.calls.refreshFriends, 3)
})

test('reloads when a different user is authenticated within the window', async () => {
  const state = {}
  const stubs = createServiceStubs()
  let authUserId = 7

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: stubGet(stubs),
    getAuthUserId: () => authUserId,
    loadCurrentProfileData: stubs.loadCurrentProfileData,
    now: () => 1000,
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
  })

  await loadCurrentProfile()
  authUserId = 99
  await loadCurrentProfile()

  assert.equal(stubs.calls.getProfile, 2)
})

test('a stale in-flight response cannot overwrite a newer profile load', async () => {
  const state = {}
  let resolveSlow
  let resolveFast
  let loads = 0

  const loadCurrentProfileData = async () => {
    loads += 1
    if (loads === 1) {
      return new Promise((resolve) => {
        resolveSlow = resolve
      })
    }
    return new Promise((resolve) => {
      resolveFast = resolve
    })
  }

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: () => ({ loadLeaderboard: () => {}, refreshFriendContext: () => {} }),
    getAuthUserId: () => 7,
    loadCurrentProfileData,
    now: () => 1000,
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
  })

  const slowLoad = loadCurrentProfile()
  const fastLoad = loadCurrentProfile({ force: true })

  resolveFast({ currentProfile: { id: 7, username: 'fresh' }, friends: [] })
  await fastLoad

  resolveSlow({ currentProfile: { id: 7, username: 'stale' }, friends: [] })
  await slowLoad

  assert.equal(state.currentProfile.username, 'fresh')
})
