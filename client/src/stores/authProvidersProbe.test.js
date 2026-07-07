import assert from 'node:assert/strict'
import test from 'node:test'
import { loadAuthProvidersWithRetry } from './authProvidersProbe.js'

test('keeps probing while compose dev brings the API up', async () => {
  let calls = 0
  const state = {}
  const waits = []

  const result = await loadAuthProvidersWithRetry({
    fetchAuthProviders: async () => {
      calls += 1

      if (calls <= 40) {
        throw new Error('ECONNREFUSED')
      }

      return { providers: { fortyTwo: true } }
    },
    set: (nextState) => Object.assign(state, nextState),
    delay: async (ms) => {
      waits.push(ms)
    },
  })

  assert.equal(calls, 41)
  assert.equal(waits.length, 40)
  assert.deepEqual(result, { providers: { fortyTwo: true } })
  assert.equal(state.isFortyTwoLoginEnabled, true)
  assert.equal(state.isAuthProvidersLoading, false)
})
