const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const registerHandlers = require('./socket.handlers')
const matchmaking = require('#modules/game/matchmaking.service')
const roomService = require('#modules/room/room.service')

// Minimal fakes: registerHandlers only registers listeners and joins a couple
// of rooms up front, so a socket that records its `on` handlers and its room
// membership is enough to exercise the room-watch subscription (audit B5).
const createIo = () => ({
  to: () => ({ emit: () => {} }),
  emit: () => {},
})

const createSocket = () => {
  const handlers = {}
  const socket = {
    handlers,
    rooms: new Set(),
    user: { id: 1, username: 'watcher' },
    join: (room) => socket.rooms.add(room),
    leave: (room) => socket.rooms.delete(room),
    on: (event, handler) => {
      handlers[event] = handler
    },
    emit: () => {},
  }
  return socket
}

describe('room-watch subscription (B5)', () => {
  it('rooms:watch joins the shared rooms broadcast room', () => {
    const socket = createSocket()
    registerHandlers(createIo(), socket)

    assert.equal(typeof socket.handlers['rooms:watch'], 'function')
    assert.ok(!socket.rooms.has('rooms'))
    socket.handlers['rooms:watch']()
    assert.ok(socket.rooms.has('rooms'))
  })

  it('rooms:unwatch leaves the rooms broadcast room', () => {
    const socket = createSocket()
    registerHandlers(createIo(), socket)

    socket.handlers['rooms:watch']()
    socket.handlers['rooms:unwatch']()
    assert.ok(!socket.rooms.has('rooms'))
  })

  it('does not put a plain connection in the rooms room until it watches', () => {
    const socket = createSocket()
    registerHandlers(createIo(), socket)
    // A socket that connects but never opens a room-grid page must not receive
    // rooms_update broadcasts.
    assert.ok(!socket.rooms.has('rooms'))
  })
})

// Restore whatever methods a test patched on the shared service singletons.
const withStubs = async (stubs, body) => {
  const originals = stubs.map(([object, key]) => [object, key, object[key]])
  stubs.forEach(([object, key, fn]) => {
    object[key] = fn
  })
  try {
    await body()
  } finally {
    originals.forEach(([object, key, fn]) => {
      object[key] = fn
    })
  }
}

describe('room entry frees a stranded in-game seat', () => {
  it('room:create abandons the caller stranded game before opening a room', async () => {
    const calls = []
    await withStubs(
      [
        [
          matchmaking,
          'handlePlayerDisconnect',
          async () => {
            calls.push('abandon')
            // No game in flight is the common case; the abandon is a no-op and
            // create proceeds. The ordering is what this test pins down.
            return null
          },
        ],
        [
          roomService,
          'createRoom',
          async () => {
            calls.push('create')
            return { id: 7, status: 'OPEN', capacity: 2, players: [] }
          },
        ],
        [roomService, 'isRoomFull', () => false],
        [roomService, 'listRooms', async () => []],
      ],
      async () => {
        const socket = createSocket()
        registerHandlers(createIo(), socket)
        await socket.handlers['room:create']({})
      },
    )

    // Without the fix the create handler never reaches the abandon path, so
    // 'abandon' is absent; the seat a walked-away game left behind would still
    // block createRoom. With it, the stranded game is ended first.
    assert.deepEqual(calls, ['abandon', 'create'])
  })
})

describe('room lifecycle ordering (#429)', () => {
  // Give the second action a real chance to overtake the first: flush pending
  // promise callbacks and one timer tick so an unordered handler would already
  // have reached its service call before the gate opens.
  const flushPendingWork = () => new Promise((resolve) => setImmediate(resolve))

  it('room:create waits for a pending room:leave to finish', async () => {
    // Leaving the waiting room and clicking "+ Room" arrive back to back. If
    // create overtakes the leave, createRoom still sees the old seat and hands
    // back the room the player just left — the lobby's ghost room.
    const calls = []
    let releaseLeave
    const leaveGate = new Promise((resolve) => {
      releaseLeave = resolve
    })

    await withStubs(
      [
        [
          roomService,
          'leaveOpenRoom',
          async () => {
            calls.push('leave:start')
            await leaveGate
            calls.push('leave:finish')
            return { id: 3, players: [] }
          },
        ],
        [matchmaking, 'handlePlayerDisconnect', async () => null],
        [
          roomService,
          'createRoom',
          async () => {
            calls.push('create')
            return { id: 9, status: 'OPEN', capacity: 2, players: [] }
          },
        ],
        [roomService, 'isRoomFull', () => false],
        [roomService, 'listRooms', async () => []],
      ],
      async () => {
        const socket = createSocket()
        registerHandlers(createIo(), socket)
        const leavePromise = socket.handlers['room:leave']()
        const createPromise = socket.handlers['room:create']({})
        await flushPendingWork()
        releaseLeave()
        await Promise.all([leavePromise, createPromise])
      },
    )

    assert.deepEqual(calls, ['leave:start', 'leave:finish', 'create'])
  })

  it('room:leave waits for a pending room:end to finish', async () => {
    // "End the room" navigates to the lobby right away and the waiting-room
    // unmount then emits room:leave. If the leave overtakes the end, the owner
    // is unseated first, endOwnedRoom no longer finds an owned room, and
    // ending degrades into an owner handoff that leaves the room visible.
    const calls = []
    let releaseEnd
    const endGate = new Promise((resolve) => {
      releaseEnd = resolve
    })

    await withStubs(
      [
        [
          roomService,
          'endOwnedRoom',
          async () => {
            calls.push('end:start')
            await endGate
            calls.push('end:finish')
            return { id: 4, players: [] }
          },
        ],
        [
          roomService,
          'leaveOpenRoom',
          async () => {
            calls.push('leave')
            return null
          },
        ],
        [roomService, 'listRooms', async () => []],
      ],
      async () => {
        const socket = createSocket()
        registerHandlers(createIo(), socket)
        const endPromise = socket.handlers['room:end']()
        const leavePromise = socket.handlers['room:leave']()
        await flushPendingWork()
        releaseEnd()
        await Promise.all([endPromise, leavePromise])
      },
    )

    assert.deepEqual(calls, ['end:start', 'end:finish', 'leave'])
  })

  it('skips a duplicate room:create while one is already pending', async () => {
    // Double-clicking "+ Room" must still dedupe, not run twice back to back:
    // a queued duplicate would re-run the abandon step and could end the game
    // the first create just started.
    const calls = []
    let releaseCreate
    const createGate = new Promise((resolve) => {
      releaseCreate = resolve
    })

    await withStubs(
      [
        [matchmaking, 'handlePlayerDisconnect', async () => null],
        [
          roomService,
          'createRoom',
          async () => {
            calls.push('create')
            await createGate
            return { id: 9, status: 'OPEN', capacity: 2, players: [] }
          },
        ],
        [roomService, 'isRoomFull', () => false],
        [roomService, 'listRooms', async () => []],
      ],
      async () => {
        const socket = createSocket()
        registerHandlers(createIo(), socket)
        const firstCreate = socket.handlers['room:create']({})
        const secondCreate = socket.handlers['room:create']({})
        await flushPendingWork()
        releaseCreate()
        await Promise.all([firstCreate, secondCreate])
      },
    )

    assert.deepEqual(calls, ['create'])
  })
})
