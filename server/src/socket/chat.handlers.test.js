const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const {
  parsePrivateRecipientId,
  registerChatHandlers,
} = require('./chat.handlers')

const createIo = () => {
  const emissions = []
  return {
    emissions,
    to: (room) => ({
      emit: (event, payload) => {
        emissions.push({ event, payload, room })
      },
    }),
  }
}

const createSocket = () => {
  const handlers = {}
  const emissions = []
  return {
    emissions,
    handlers,
    rooms: new Set(['channel:#general', 'user:1']),
    user: { id: 1, username: 'sender' },
    emit: (event, payload) => {
      emissions.push({ event, payload })
    },
    on: (event, handler) => {
      handlers[event] = handler
    },
  }
}

describe('parsePrivateRecipientId', () => {
  it('parses valid user room ids', () => {
    assert.equal(parsePrivateRecipientId('user:42'), 42)
  })

  it('rejects non-user and invalid room ids', () => {
    assert.equal(parsePrivateRecipientId('channel:#general'), null)
    assert.equal(parsePrivateRecipientId('user:0'), null)
    assert.equal(parsePrivateRecipientId('user:not-a-number'), null)
  })
})

describe('registerChatHandlers', () => {
  it('broadcasts room messages only to rooms the socket has joined', () => {
    const io = createIo()
    const socket = createSocket()
    registerChatHandlers(io, socket)

    socket.handlers['chat:message']({
      recipient: 'channel:#general',
      message: 'hello room',
    })
    socket.handlers['chat:message']({
      recipient: 'channel:#other',
      message: 'not joined',
    })

    assert.deepEqual(io.emissions, [
      {
        event: 'chat:message',
        room: 'channel:#general',
        payload: {
          message: 'hello room',
          recipient: 'channel:#general',
          user: { id: 1, username: 'sender' },
        },
      },
    ])
  })

  it('delivers private messages to accepted friends', async () => {
    const io = createIo()
    const socket = createSocket()
    const repository = {
      findRelationshipBetweenUsers: async () => ({ status: 'ACCEPTED' }),
    }
    registerChatHandlers(io, socket, { repository })

    await socket.handlers['chat:private_message']({
      recipient: 'user:2',
      message: 'hello friend',
    })

    assert.deepEqual(io.emissions, [
      {
        event: 'chat:private_message',
        room: 'user:1',
        payload: {
          message: 'hello friend',
          recipient: 'user:2',
          user: { id: 1, username: 'sender' },
        },
      },
      {
        event: 'chat:private_message',
        room: 'user:2',
        payload: {
          message: 'hello friend',
          recipient: 'user:2',
          user: { id: 1, username: 'sender' },
        },
      },
    ])
  })

  it('rejects private messages to non-friends', async () => {
    const io = createIo()
    const socket = createSocket()
    const repository = {
      findRelationshipBetweenUsers: async () => null,
    }
    registerChatHandlers(io, socket, { repository })

    await socket.handlers['chat:private_message']({
      recipient: 'user:2',
      message: 'hello stranger',
    })

    assert.deepEqual(io.emissions, [])
    assert.deepEqual(socket.emissions, [
      {
        event: 'chat:error',
        payload: {
          message: 'Private messages are only available between friends',
        },
      },
    ])
  })
})
