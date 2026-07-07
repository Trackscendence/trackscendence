import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getOwnRoomIds,
  rememberClosedRoomIds,
  resolveVisibleRooms,
} from './roomVisibility.js'

const room = ({ id, players }) => ({
  id,
  players: players.map((userId) => ({ userId })),
})

test('remembers the current player room before an owner ends it', () => {
  assert.deepEqual(getOwnRoomIds([room({ id: 589, players: [7] })], 7), [589])
})

test('keeps a closed room hidden after a new create clears own-room suppression', () => {
  const result = resolveVisibleRooms({
    rooms: [room({ id: 589, players: [7] }), room({ id: 590, players: [7] })],
    ownUserId: 7,
    suppressOwnRoom: false,
    suppressedClosedRoomIds: [589],
  })

  assert.deepEqual(
    result.rooms.map((visibleRoom) => visibleRoom.id),
    [590],
  )
})

test('shows a room again after a non-ending leave removes the current player', () => {
  const result = resolveVisibleRooms({
    rooms: [room({ id: 589, players: [8] })],
    ownUserId: 7,
    suppressOwnRoom: true,
    suppressedClosedRoomIds: [],
  })

  assert.deepEqual(
    result.rooms.map((visibleRoom) => visibleRoom.id),
    [589],
  )
  assert.equal(result.suppressOwnRoom, false)
})

test('bounds remembered closed rooms', () => {
  const roomIds = Array.from({ length: 25 }, (_, index) => index + 1)

  assert.deepEqual(rememberClosedRoomIds([], roomIds), roomIds.slice(5))
})
