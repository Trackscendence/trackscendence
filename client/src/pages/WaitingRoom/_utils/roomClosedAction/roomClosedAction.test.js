import assert from 'node:assert/strict'
import test from 'node:test'
import { getRoomClosedAction, ROOM_CLOSED_ACTIONS } from './roomClosedAction.js'

test('ignores empty room close state', () => {
  assert.equal(
    getRoomClosedAction({ closedRoomId: null, currentRoomId: null }),
    ROOM_CLOSED_ACTIONS.ignore,
  )
})

test('navigates when the currently seated room closes', () => {
  assert.equal(
    getRoomClosedAction({ closedRoomId: 589, currentRoomId: 589 }),
    ROOM_CLOSED_ACTIONS.navigate,
  )
})

test('clears a stale closed room before a new create intent hydrates', () => {
  assert.equal(
    getRoomClosedAction({
      closedRoomId: 589,
      currentRoomId: null,
      seatIntent: { type: 'create', capacity: 4 },
    }),
    ROOM_CLOSED_ACTIONS.clear,
  )
})

test('navigates when a joined room closes before it hydrates locally', () => {
  assert.equal(
    getRoomClosedAction({
      closedRoomId: 589,
      currentRoomId: null,
      seatIntent: { type: 'join', roomId: '589' },
    }),
    ROOM_CLOSED_ACTIONS.navigate,
  )
})

test('clears a closed room event for a different current room', () => {
  assert.equal(
    getRoomClosedAction({ closedRoomId: 589, currentRoomId: 590 }),
    ROOM_CLOSED_ACTIONS.clear,
  )
})
