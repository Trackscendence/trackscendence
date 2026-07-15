import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getOwnRoomIds,
  rememberRoomIds,
  resolveVisibleRooms,
} from './roomVisibility.js'

const room = ({ id, players }) => ({
  id,
  players: players.map((userId) => ({ userId })),
})

test('remembers the current player room before an owner ends it', () => {
  assert.deepEqual(getOwnRoomIds([room({ id: 589, players: [7] })], 7), [589])
})

test('keeps a closed room hidden regardless of who the snapshot seats in it', () => {
  const result = resolveVisibleRooms({
    rooms: [room({ id: 589, players: [7] }), room({ id: 590, players: [7] })],
    ownUserId: 7,
    pendingLeftRoomIds: [],
    suppressedClosedRoomIds: [589],
  })

  assert.deepEqual(
    result.rooms.map((visibleRoom) => visibleRoom.id),
    [590],
  )
})

test('hides a just-left room while a stale snapshot still seats the player', () => {
  // The ghost-room repro (#429): leave room 589, click "+ Room", and a late
  // rooms_update that predates the leave arrives. The pending-left id keeps
  // 589 hidden while the fresh room 590 renders.
  const result = resolveVisibleRooms({
    rooms: [room({ id: 589, players: [7] }), room({ id: 590, players: [7] })],
    ownUserId: 7,
    pendingLeftRoomIds: [589],
    suppressedClosedRoomIds: [],
  })

  assert.deepEqual(
    result.rooms.map((visibleRoom) => visibleRoom.id),
    [590],
  )
  assert.equal(result.pendingLeftRoomIds, undefined)
})

test('shows a room again after a non-ending leave removes the current player', () => {
  const result = resolveVisibleRooms({
    rooms: [room({ id: 589, players: [8] })],
    ownUserId: 7,
    pendingLeftRoomIds: [589],
    suppressedClosedRoomIds: [],
  })

  assert.deepEqual(
    result.rooms.map((visibleRoom) => visibleRoom.id),
    [589],
  )
  assert.deepEqual(result.pendingLeftRoomIds, [])
})

test('expires a pending-left id once its room drops out of the snapshot', () => {
  const result = resolveVisibleRooms({
    rooms: [room({ id: 590, players: [7] })],
    ownUserId: 7,
    pendingLeftRoomIds: [589],
    suppressedClosedRoomIds: [],
  })

  assert.deepEqual(
    result.rooms.map((visibleRoom) => visibleRoom.id),
    [590],
  )
  assert.deepEqual(result.pendingLeftRoomIds, [])
})

test('bounds remembered room ids', () => {
  const roomIds = Array.from({ length: 25 }, (_, index) => index + 1)

  assert.deepEqual(rememberRoomIds([], roomIds), roomIds.slice(5))
})
