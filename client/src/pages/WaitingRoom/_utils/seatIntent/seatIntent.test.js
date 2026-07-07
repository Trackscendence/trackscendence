import assert from 'node:assert/strict'
import test from 'node:test'
import {
  claimSeatIntent,
  getSeatIntentKey,
  resetSeatIntentClaimsForTests,
} from './seatIntent.js'

test('normalizes matching seat intents to the same key', () => {
  assert.equal(
    getSeatIntentKey({ type: 'create', capacity: '4' }),
    getSeatIntentKey({ type: 'create', capacity: 4 }),
  )
  assert.equal(
    getSeatIntentKey({ type: 'join', roomId: '8' }),
    getSeatIntentKey({ type: 'join', roomId: 8 }),
  )
})

test('keeps create and join intents distinct', () => {
  assert.notEqual(
    getSeatIntentKey({ type: 'create', capacity: 4 }),
    getSeatIntentKey({ type: 'join', roomId: 4 }),
  )
})

test('accepts the default create intent from the lobby button', () => {
  assert.equal(getSeatIntentKey({ type: 'create' }), 'create:default')
})

test('claims a navigation-scoped seat intent only once', () => {
  resetSeatIntentClaimsForTests()

  assert.equal(
    claimSeatIntent({ type: 'create', capacity: 4 }, 'location-a'),
    true,
  )
  assert.equal(
    claimSeatIntent({ type: 'create', capacity: '4' }, 'location-a'),
    false,
  )
  assert.equal(
    claimSeatIntent({ type: 'create', capacity: 4 }, 'location-b'),
    true,
  )
})

test('bounds remembered seat intent claims', () => {
  resetSeatIntentClaimsForTests()

  for (let index = 0; index < 21; index += 1) {
    assert.equal(
      claimSeatIntent({ type: 'join', roomId: index + 1 }, `location-${index}`),
      true,
    )
  }

  assert.equal(claimSeatIntent({ type: 'join', roomId: 1 }, 'location-0'), true)
})
