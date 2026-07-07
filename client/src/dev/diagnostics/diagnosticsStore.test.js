import assert from 'node:assert/strict'
import test from 'node:test'
import { appendBounded, MAX_EVENTS } from './diagnosticsStore.js'

test('keeps the log bounded no matter how many events arrive', () => {
  let events = []
  for (let index = 0; index < MAX_EVENTS * 3; index += 1) {
    events = appendBounded(events, { id: index })
  }
  assert.equal(events.length, MAX_EVENTS)
  // The survivors are the most recent ones; the oldest fell off the front.
  assert.equal(events[0].id, MAX_EVENTS * 3 - MAX_EVENTS)
  assert.equal(events.at(-1).id, MAX_EVENTS * 3 - 1)
})

test('appends in order until the cap is reached', () => {
  const events = appendBounded(appendBounded([], { id: 1 }), { id: 2 })
  assert.deepEqual(
    events.map((event) => event.id),
    [1, 2],
  )
})

test('respects a custom cap', () => {
  let events = []
  for (let index = 0; index < 10; index += 1) {
    events = appendBounded(events, { id: index }, 3)
  }
  assert.equal(events.length, 3)
  assert.deepEqual(
    events.map((event) => event.id),
    [7, 8, 9],
  )
})
