import assert from 'node:assert/strict'
import test from 'node:test'
import { getOpponentSeats } from './opponentSeats.js'

test('keeps the existing one to three opponent seats', () => {
  assert.deepEqual(getOpponentSeats(1), ['top'])
  assert.deepEqual(getOpponentSeats(2), ['left', 'right'])
  assert.deepEqual(getOpponentSeats(3), ['top', 'left', 'right'])
})

test('places four opponents as two top seats plus sides', () => {
  assert.deepEqual(getOpponentSeats(4), [
    'top-left',
    'top-right',
    'left',
    'right',
  ])
})

test('places five opponents as three top seats plus sides', () => {
  assert.deepEqual(getOpponentSeats(5), [
    'top-left',
    'top',
    'top-right',
    'left',
    'right',
  ])
})
