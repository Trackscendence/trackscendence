import assert from 'node:assert/strict'
import test from 'node:test'
import { createPublicProfileLoader } from './profileStore.publicProfileLoader.js'

test('keeps stale public profile responses from replacing the current profile', async () => {
  const state = {
    isLoading: false,
    publicProfile: null,
    relationship: null,
  }
  let leaderboardLoads = 0
  let resolveSlow
  let resolveFast

  const loadPublicProfile = createPublicProfileLoader({
    get: () => ({
      loadLeaderboard: () => {
        leaderboardLoads += 1
      },
    }),
    loadPublicProfileData: async ({ username }) => {
      if (username === 'slow') {
        return new Promise((resolve) => {
          resolveSlow = resolve
        })
      }

      return new Promise((resolve) => {
        resolveFast = resolve
      })
    },
    requireToken: () => 'token-1',
    set: (nextState) => Object.assign(state, nextState),
  })

  const slowLoad = loadPublicProfile('slow')
  const fastLoad = loadPublicProfile('fast')

  resolveFast({
    publicProfile: { id: 2, username: 'fast' },
    relationship: { status: 'NONE' },
  })
  await fastLoad

  assert.equal(state.publicProfile.username, 'fast')
  assert.equal(state.isLoading, false)
  assert.equal(leaderboardLoads, 1)

  resolveSlow({
    publicProfile: { id: 1, username: 'slow' },
    relationship: { status: 'NONE' },
  })
  await slowLoad

  assert.equal(state.publicProfile.username, 'fast')
  assert.equal(state.isLoading, false)
  assert.equal(leaderboardLoads, 1)
})
