import assert from 'node:assert/strict'
import test from 'node:test'
import { getSeatIntentKey } from './seatIntent.js'

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
