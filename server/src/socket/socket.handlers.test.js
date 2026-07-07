const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const registerHandlers = require('./socket.handlers')

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
