const { describe, it, mock, afterEach } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const roomService = require('#modules/room/room.service')
const roomRepository = require('#modules/room/room.repository')

// The capacity guard runs before any database access, so it can be exercised
// without a live database (#156).
describe('seatUser capacity validation', () => {
  const user = { id: 1, username: 'tester' }

  it('rejects a capacity that is not an offered room size', async () => {
    await assert.rejects(
      () => roomService.seatUser(user, { capacity: 5 }),
      /Unsupported room size/,
    )
  })

  it('rejects an out-of-range capacity', async () => {
    await assert.rejects(() => roomService.seatUser(user, { capacity: 99 }))
    await assert.rejects(() => roomService.seatUser(user, { capacity: 0 }))
  })

  it('rejects a non-numeric capacity', async () => {
    await assert.rejects(() => roomService.seatUser(user, { capacity: NaN }))
  })
})

// Filling a larger room means several players race for the same seats, and the
// serializable seat transactions abort on conflict. The service absorbs those
// aborts by retrying, so the last joiner is never stranded (#154). This drives
// the retry loop with a stubbed repository: the seat write loses the race a few
// times before it lands, and the caller must still end up seated.
describe('seatUser survives repeated seat contention', () => {
  const user = { id: 7, username: 'racer' }
  const seatedRoom = {
    id: 1,
    name: "owner's room",
    capacity: 4,
    status: 'OPEN',
    owner: { id: 2, username: 'owner' },
    players: [{ user: { id: 7, username: 'racer' } }],
  }

  afterEach(() => mock.restoreAll())

  it('retries until the contended seat write lands', async () => {
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => null)
    mock.method(roomRepository, 'findVisibleRooms', async () => [
      { id: 1, status: 'OPEN', capacity: 4, players: [] },
    ])
    // A room already exists, so the caller can never create one; its only path
    // to a seat is winning the contended join, which loses twice then lands.
    mock.method(roomRepository, 'createRoomIfUnderLimit', async () => ({
      error: roomRepository.ROOM_ERRORS.LIMIT_REACHED,
    }))
    let joinAttempts = 0
    mock.method(roomRepository, 'addPlayerToRoom', async () => {
      joinAttempts += 1
      if (joinAttempts < 3) {
        return { error: roomRepository.ROOM_ERRORS.CONFLICT }
      }
      return { room: seatedRoom }
    })

    const dto = await roomService.seatUser(user, { capacity: 4 })

    assert.strictEqual(dto.id, 1)
    assert.strictEqual(joinAttempts, 3)
    assert.deepStrictEqual(
      dto.players.map((player) => player.userId),
      [7],
    )
  })

  it('gives up with a clear error once the attempt budget is spent', async () => {
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => null)
    mock.method(roomRepository, 'findVisibleRooms', async () => [
      { id: 1, status: 'OPEN', capacity: 4, players: [] },
    ])
    mock.method(roomRepository, 'createRoomIfUnderLimit', async () => ({
      error: roomRepository.ROOM_ERRORS.LIMIT_REACHED,
    }))
    // The seat never lands: every attempt loses the race.
    mock.method(roomRepository, 'addPlayerToRoom', async () => ({
      error: roomRepository.ROOM_ERRORS.CONFLICT,
    }))

    await assert.rejects(
      () => roomService.seatUser(user, { capacity: 4 }),
      /No seat is available/,
    )
  })
})

describe('createRoomForOwner', () => {
  const owner = { id: 11, username: 'dev-bot' }
  const openedRoom = {
    id: 22,
    name: "bot's room",
    capacity: 2,
    status: 'OPEN',
    owner: { id: 11, username: 'dev-bot' },
    players: [{ user: { id: 11, username: 'dev-bot' } }],
  }

  afterEach(() => mock.restoreAll())

  it('opens a new room for the owner instead of joining another room', async () => {
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => null)
    mock.method(roomRepository, 'createRoomIfUnderLimit', async (data) => {
      assert.deepStrictEqual(data, {
        name: "bot's room",
        capacity: 2,
        ownerId: 11,
        maxOpenRooms: 1,
      })
      return { room: openedRoom }
    })

    const dto = await roomService.createRoomForOwner(owner, {
      capacity: 2,
      name: "bot's room",
    })

    assert.strictEqual(dto.id, 22)
    assert.strictEqual(dto.owner.userId, 11)
    assert.deepStrictEqual(
      dto.players.map((player) => player.userId),
      [11],
    )
  })

  it('reuses the owner seat when that owner already has an open room', async () => {
    mock.method(
      roomRepository,
      'findActiveRoomByUserId',
      async () => openedRoom,
    )
    const createMock = mock.method(
      roomRepository,
      'createRoomIfUnderLimit',
      async () => ({ room: null }),
    )

    const dto = await roomService.createRoomForOwner(owner, { capacity: 2 })

    assert.strictEqual(dto.id, 22)
    assert.strictEqual(createMock.mock.callCount(), 0)
  })

  it('rejects when the open-room limit is already reached', async () => {
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => null)
    mock.method(roomRepository, 'createRoomIfUnderLimit', async () => ({
      error: roomRepository.ROOM_ERRORS.LIMIT_REACHED,
    }))

    await assert.rejects(
      () => roomService.createRoomForOwner(owner, { capacity: 2 }),
      /A room is already open/,
    )
  })
})
