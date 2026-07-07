const { describe, it, mock, afterEach } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const roomService = require('#modules/room/room.service')
const roomRepository = require('#modules/room/room.repository')
const botPlayers = require('#modules/game/bot-player.service')
const {
  ALLOWED_CAPACITIES,
  MAX_OPEN_ROOMS,
} = require('#modules/room/room.constants')

// The capacity guard runs before any database access, so it can be exercised
// without a live database (#156).
describe('seatUser capacity validation', () => {
  const user = { id: 1, username: 'tester' }

  it('offers six-player rooms', () => {
    assert.deepStrictEqual(ALLOWED_CAPACITIES, [2, 3, 4, 6])
  })

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
    ownerId: 11,
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
        maxOpenRooms: MAX_OPEN_ROOMS,
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
      /room limit/,
    )
  })
})

describe('createRoom', () => {
  const user = { id: 31, username: 'creator' }
  const openedRoom = {
    id: 44,
    name: "creator's room",
    capacity: 4,
    status: 'OPEN',
    ownerId: 31,
    owner: { id: 31, username: 'creator' },
    players: [{ user: { id: 31, username: 'creator' } }],
  }

  afterEach(() => mock.restoreAll())

  it('opens a new owned room instead of joining another open room', async () => {
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => null)
    const joinMock = mock.method(
      roomRepository,
      'addPlayerToRoom',
      async () => {
        assert.fail('createRoom must not join an existing room')
      },
    )
    mock.method(roomRepository, 'createRoomIfUnderLimit', async (data) => {
      assert.deepStrictEqual(data, {
        name: "creator's room",
        capacity: 4,
        ownerId: 31,
        maxOpenRooms: MAX_OPEN_ROOMS,
      })
      return { room: openedRoom }
    })

    const dto = await roomService.createRoom(user, { capacity: 4 })

    assert.strictEqual(dto.id, 44)
    assert.strictEqual(dto.capacity, 4)
    assert.strictEqual(dto.owner.userId, 31)
    assert.strictEqual(joinMock.mock.callCount(), 0)
  })

  it('reuses the room opened by a concurrent duplicate create', async () => {
    let activeReads = 0
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => {
      activeReads += 1
      return activeReads === 1 ? null : openedRoom
    })
    const createMock = mock.method(
      roomRepository,
      'createRoomIfUnderLimit',
      async () => ({ error: roomRepository.ROOM_ERRORS.CONFLICT }),
    )

    const dto = await roomService.createRoom(user, { capacity: 4 })

    assert.strictEqual(dto.id, 44)
    assert.strictEqual(dto.owner.userId, 31)
    assert.strictEqual(createMock.mock.callCount(), 1)
  })

  it('reuses the caller owned open room on a duplicate create', async () => {
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

    const dto = await roomService.createRoom(user, { capacity: 4 })

    assert.strictEqual(dto.id, 44)
    assert.strictEqual(createMock.mock.callCount(), 0)
  })

  it('rejects when the caller is already seated in another open room', async () => {
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => ({
      id: 55,
      name: "owner's room",
      capacity: 2,
      status: 'OPEN',
      ownerId: 99,
      owner: { id: 99, username: 'owner' },
      players: [
        { user: { id: 99, username: 'owner' } },
        { user: { id: 31, username: 'creator' } },
      ],
    }))

    await assert.rejects(
      () => roomService.createRoom(user, { capacity: 2 }),
      /Leave your current room/,
    )
  })
})

describe('fillOpenRoomWithBots', () => {
  const ownerUserId = 41
  const owner = { id: ownerUserId, username: 'owner' }
  const openRoom = {
    id: 77,
    name: "owner's room",
    capacity: 3,
    status: 'OPEN',
    ownerId: ownerUserId,
    owner,
    players: [{ user: owner }],
  }
  const botOne = {
    id: 501,
    username: 'bot-uno',
    displayName: 'Uno',
    avatarUrl: null,
  }
  const botTwo = {
    id: 502,
    username: 'bot-skip',
    displayName: 'Skip',
    avatarUrl: null,
  }

  afterEach(() => mock.restoreAll())

  it('fills the owner room through the normal seat mutation path', async () => {
    mock.method(roomRepository, 'findOpenRoomByUserId', async () => openRoom)
    mock.method(botPlayers, 'getBotPoolSize', () => 2)
    mock.method(botPlayers, 'ensureBotPlayers', async () => [botOne, botTwo])
    mock.method(roomRepository, 'findActiveRoomByUserId', async () => null)
    const addMock = mock.method(
      roomRepository,
      'addPlayerToRoom',
      async (roomId, userId) => {
        assert.strictEqual(roomId, 77)
        const players =
          userId === botOne.id
            ? [{ user: owner }, { user: botOne }]
            : [{ user: owner }, { user: botOne }, { user: botTwo }]
        return {
          room: {
            ...openRoom,
            players,
          },
        }
      },
    )

    const dto = await roomService.fillOpenRoomWithBots(ownerUserId)

    assert.strictEqual(addMock.mock.callCount(), 2)
    assert.deepStrictEqual(
      dto.players.map((player) => player.userId),
      [ownerUserId, botOne.id, botTwo.id],
    )
  })

  it('rejects when the caller is seated but does not own the room', async () => {
    mock.method(roomRepository, 'findOpenRoomByUserId', async () => ({
      ...openRoom,
      ownerId: 99,
    }))

    await assert.rejects(
      () => roomService.fillOpenRoomWithBots(ownerUserId),
      /Only the room owner/,
    )
  })

  it('skips bot users that are already seated in another active room', async () => {
    mock.method(roomRepository, 'findOpenRoomByUserId', async () => openRoom)
    mock.method(botPlayers, 'getBotPoolSize', () => 2)
    mock.method(botPlayers, 'ensureBotPlayers', async () => [botOne, botTwo])
    mock.method(roomRepository, 'findActiveRoomByUserId', async (userId) =>
      userId === botOne.id ? { id: 88 } : null,
    )
    const addMock = mock.method(
      roomRepository,
      'addPlayerToRoom',
      async (roomId, userId) => ({
        room: {
          ...openRoom,
          players: [{ user: owner }, { user: { ...botTwo, id: userId } }],
        },
      }),
    )

    await assert.rejects(
      () => roomService.fillOpenRoomWithBots(ownerUserId),
      /No bot seats/,
    )
    assert.strictEqual(addMock.mock.callCount(), 1)
  })
})

// When a player leaves a running game (a forfeit or an expired reconnect), the
// survivors keep their room: it reopens for a fresh game instead of stranding
// them. The service picks who to unseat (the leaver plus any bots, since bots
// never wait in the lobby) and delegates the flip to the repository.
describe('reopenRoomForSurvivors', () => {
  afterEach(() => mock.restoreAll())

  const humanPlayer = (id, username) => ({
    user: { id, username, displayName: null, avatarUrl: null },
  })

  const gameRoom = {
    id: 42,
    name: "owner's room",
    capacity: 4,
    status: 'IN_GAME',
    gameId: 'game-uuid',
    owner: { id: 1, username: 'owner' },
    players: [humanPlayer(1, 'owner'), humanPlayer(2, 'rival')],
  }

  it('does nothing when no active room is tied to the game', async () => {
    mock.method(roomRepository, 'findActiveRoomByGameId', async () => null)
    const result = await roomService.reopenRoomForSurvivors('missing', 2)
    assert.strictEqual(result, null)
  })

  it('unseats only the leaver when the game has no bots', async () => {
    mock.method(roomRepository, 'findActiveRoomByGameId', async () => gameRoom)
    mock.method(botPlayers, 'isBotUserId', () => false)
    let passedRemoveIds
    mock.method(
      roomRepository,
      'reopenRoomForRematch',
      async (roomId, removeIds) => {
        passedRemoveIds = removeIds
        return {
          room: {
            ...gameRoom,
            status: 'OPEN',
            players: [humanPlayer(1, 'owner')],
          },
          reopened: true,
        }
      },
    )

    const result = await roomService.reopenRoomForSurvivors('game-uuid', 2)

    assert.deepStrictEqual(passedRemoveIds, [2])
    assert.strictEqual(result.reopened, true)
    assert.strictEqual(result.room.status, 'OPEN')
  })

  it('unseats the leaver and every bot so only humans wait', async () => {
    const roomWithBot = {
      ...gameRoom,
      players: [
        humanPlayer(1, 'owner'),
        humanPlayer(2, 'leaver'),
        humanPlayer(9, 'bot'),
      ],
    }
    mock.method(
      roomRepository,
      'findActiveRoomByGameId',
      async () => roomWithBot,
    )
    mock.method(botPlayers, 'isBotUserId', (id) => id === 9)
    let passedRemoveIds
    mock.method(
      roomRepository,
      'reopenRoomForRematch',
      async (roomId, removeIds) => {
        passedRemoveIds = removeIds
        return {
          room: {
            ...roomWithBot,
            status: 'OPEN',
            players: [humanPlayer(1, 'owner')],
          },
          reopened: true,
        }
      },
    )

    const result = await roomService.reopenRoomForSurvivors('game-uuid', 2)

    assert.deepStrictEqual(passedRemoveIds, [2, 9])
    assert.strictEqual(result.reopened, true)
  })

  it('reports the room closed when no human survivors remain', async () => {
    const botOnlyRoom = {
      ...gameRoom,
      owner: { id: 2, username: 'leaver' },
      players: [humanPlayer(2, 'leaver'), humanPlayer(9, 'bot')],
    }
    mock.method(
      roomRepository,
      'findActiveRoomByGameId',
      async () => botOnlyRoom,
    )
    mock.method(botPlayers, 'isBotUserId', (id) => id === 9)
    mock.method(roomRepository, 'reopenRoomForRematch', async () => ({
      room: { ...botOnlyRoom, status: 'CLOSED', players: [] },
      reopened: false,
    }))

    const result = await roomService.reopenRoomForSurvivors('game-uuid', 2)

    assert.strictEqual(result.reopened, false)
    assert.strictEqual(result.room.status, 'CLOSED')
  })
})
