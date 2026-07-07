import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CALLBACK_INCOMPLETE_MESSAGE,
  readCallbackParams,
  resolveLoginResult,
  selectCallbackView,
} from './fortyTwoCallback.js'

// A stand-in for URLSearchParams.get: returns the value or null, like the real
// thing does for absent keys.
const paramsFrom = (values) => (key) =>
  Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null

test('a complete callback carries no param error', () => {
  const { code, state, paramError } = readCallbackParams(
    paramsFrom({ code: 'abc', state: 'xyz' }),
  )

  assert.equal(code, 'abc')
  assert.equal(state, 'xyz')
  assert.equal(paramError, '')
})

test('a missing code or state is treated as a cancelled sign-in', () => {
  assert.equal(
    readCallbackParams(paramsFrom({ state: 'xyz' })).paramError,
    CALLBACK_INCOMPLETE_MESSAGE,
  )
  assert.equal(
    readCallbackParams(paramsFrom({ code: 'abc' })).paramError,
    CALLBACK_INCOMPLETE_MESSAGE,
  )
  assert.equal(
    readCallbackParams(paramsFrom({})).paramError,
    CALLBACK_INCOMPLETE_MESSAGE,
  )
})

test("the provider's own error wins over the generic message", () => {
  const { paramError } = readCallbackParams(
    paramsFrom({ error_description: 'access_denied by user' }),
  )

  assert.equal(paramError, 'access_denied by user')
})

test('falls back to the short error code when no description is given', () => {
  const { paramError } = readCallbackParams(
    paramsFrom({ error: 'invalid_scope' }),
  )

  assert.equal(paramError, 'invalid_scope')
})

test('a two-factor result routes back to login with the challenge', () => {
  const challenge = { requiresTwoFactor: true, ticket: 't-1' }
  const outcome = resolveLoginResult(challenge)

  assert.equal(outcome.type, 'twoFactor')
  assert.equal(outcome.challenge, challenge)
})

test('a completed login surfaces the signed-in user', () => {
  const outcome = resolveLoginResult({
    token: 'jwt',
    user: { username: 'ada' },
  })

  assert.equal(outcome.type, 'signedIn')
  assert.deepEqual(outcome.user, { username: 'ada' })
})

test('view is connecting until the login resolves', () => {
  assert.equal(
    selectCallbackView({ error: '', signedInUser: null }),
    'connecting',
  )
})

test('a signed-in user shows the success confirmation', () => {
  assert.equal(
    selectCallbackView({ error: '', signedInUser: { username: 'ada' } }),
    'success',
  )
})

test('an error is terminal and outranks a stale signed-in user', () => {
  assert.equal(
    selectCallbackView({
      error: 'boom',
      signedInUser: { username: 'ada' },
    }),
    'error',
  )
})
