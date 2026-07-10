import assert from 'node:assert/strict'
import test from 'node:test'
import { isActiveToken } from './sessionGuard.js'

test('a write is allowed while the captured token is still the active one', () => {
  assert.equal(
    isActiveToken('token-a', () => 'token-a'),
    true,
  )
})

test('a write is skipped after logout clears the token', () => {
  assert.equal(
    isActiveToken('token-a', () => null),
    false,
  )
})

test('a write is skipped after a different user signs in', () => {
  assert.equal(
    isActiveToken('token-a', () => 'token-b'),
    false,
  )
})

test('an action that started with no session never writes', () => {
  assert.equal(
    isActiveToken(null, () => 'token-a'),
    false,
  )
  assert.equal(
    isActiveToken(null, () => null),
    false,
  )
})
