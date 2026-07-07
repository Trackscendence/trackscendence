import assert from 'node:assert/strict'
import test from 'node:test'
import { createCurrentProfileLoader } from './profileStore.currentProfileLoader.js'

const emptyFriendContext = {
  friends: [],
  leaderboard: [],
}

// Fakes for the four REST calls a /profile mount can trigger. loadCurrentProfileData
// composes /users/me + /friends the same way the real helper does, so the calls
// object records exactly which endpoints the loader reaches — and proves the dead
// /friends/requests call is gone and the leaderboard slice asks for limit=5.
const createServiceStubs = () => {
  const calls = {
    getProfile: 0,
    listFriends: 0,
    listFriendRequests: 0,
    leaderboardParams: [],
  }

  const getProfile = async () => {
    calls.getProfile += 1
    return { user: { id: 7, username: 'me' }, relationship: null }
  }

  const listFriends = async () => {
    calls.listFriends += 1
    return { friends: [] }
  }

  const listFriendRequests = async () => {
    calls.listFriendRequests += 1
    return { incoming: [], outgoing: [] }
  }

  const getLeaderboard = async (params) => {
    calls.leaderboardParams.push(params)
    return { leaderboard: [] }
  }

  const loadCurrentProfileData = async () => {
    const [profileResult, friendsResult] = await Promise.all([
      getProfile(),
      listFriends(),
    ])
    return {
      currentProfile: profileResult.user,
      relationship: profileResult.relationship,
      friends: friendsResult.friends,
    }
  }

  const loadLeaderboard = async () => {
    await getLeaderboard({ limit: 5 })
  }

  return { calls, loadCurrentProfileData, loadLeaderboard, listFriendRequests }
}

test('loads /users/me + /friends + leaderboard(limit=5) and never /friends/requests', async () => {
  const state = {}
  const stubs = createServiceStubs()

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: () => ({ loadLeaderboard: stubs.loadLeaderboard }),
    getAuthUserId: () => 7,
    loadCurrentProfileData: stubs.loadCurrentProfileData,
    now: () => 1000,
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
  })

  await loadCurrentProfile()

  assert.equal(stubs.calls.getProfile, 1)
  assert.equal(stubs.calls.listFriends, 1)
  assert.equal(stubs.calls.listFriendRequests, 0)
  assert.deepEqual(stubs.calls.leaderboardParams, [{ limit: 5 }])
  assert.equal(state.currentProfile.username, 'me')
  assert.equal(state.isLoading, false)
})

test('skips a second load within the freshness window for the same user', async () => {
  const state = {}
  const stubs = createServiceStubs()
  let clock = 1000

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: () => ({ loadLeaderboard: stubs.loadLeaderboard }),
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

  assert.equal(stubs.calls.getProfile, 1)
  assert.equal(stubs.calls.listFriends, 1)
  assert.deepEqual(stubs.calls.leaderboardParams, [{ limit: 5 }])
})

test('reloads past the freshness window and when forced', async () => {
  const state = {}
  const stubs = createServiceStubs()
  let clock = 1000

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: () => ({ loadLeaderboard: stubs.loadLeaderboard }),
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
})

test('reloads when a different user is authenticated within the window', async () => {
  const state = {}
  const stubs = createServiceStubs()
  let authUserId = 7

  const loadCurrentProfile = createCurrentProfileLoader({
    emptyFriendContext,
    get: () => ({ loadLeaderboard: stubs.loadLeaderboard }),
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
    get: () => ({ loadLeaderboard: () => {} }),
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
