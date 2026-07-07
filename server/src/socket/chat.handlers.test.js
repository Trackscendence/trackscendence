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

const createSocket = ({ rooms = [] } = {}) => {
  const handlers = {}
  const emissions = []
  const socket = {
    emissions,
    handlers,
    rooms: new Set(['channel:#general', 'user:1', ...rooms]),
    user: { id: 1, username: 'sender' },
    emit: (event, payload) => {
      emissions.push({ event, payload })
    },
    join: (room) => {
      socket.rooms.add(room)
    },
    on: (event, handler) => {
      handlers[event] = handler
    },
  }
  return socket
}

const createChatRooms = (overrides = {}) => ({
  createMessage: async ({ message, recipient }) => ({
    id: 1,
    message,
    recipient,
    user: { id: 1, username: 'sender' },
  }),
  createRoom: async () => ({
    room: { id: 8, socketRoom: 'chat:8', name: 'Room 8' },
  }),
  joinRoom: async () => ({
    room: { id: 8, socketRoom: 'chat:8', name: 'Room 8' },
  }),
  listActiveMemberUserIds: async () => [1],
  listActiveSocketRoomsForUser: async () => [],
  listRooms: async () => ({ rooms: [] }),
  parseChatRoomRecipientId: () => null,
  ...overrides,
})

const registerTestChatHandlers = (io, socket, options = {}) => {
  registerChatHandlers(io, socket, {
    chatRooms: createChatRooms(options.chatRooms),
    repository: options.repository,
  })
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
    registerTestChatHandlers(io, socket)

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

  it('broadcasts game room messages to the active game room', () => {
    const io = createIo()
    const socket = createSocket({ rooms: ['game:game-1'] })
    registerTestChatHandlers(io, socket)

    socket.handlers['chat:message']({
      recipient: 'game:game-1',
      message: 'draw before you pass',
    })

    assert.deepEqual(io.emissions, [
      {
        event: 'chat:message',
        room: 'game:game-1',
        payload: {
          message: 'draw before you pass',
          recipient: 'game:game-1',
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
    registerTestChatHandlers(io, socket, { repository })

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
    registerTestChatHandlers(io, socket, { repository })

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

  it('joins persisted chat rooms on registration', async () => {
    const io = createIo()
    const socket = createSocket()
    registerTestChatHandlers(io, socket, {
      chatRooms: {
        listActiveSocketRoomsForUser: async () => ['chat:8'],
      },
    })

    await new Promise((resolve) => setImmediate(resolve))

    assert.equal(socket.rooms.has('chat:8'), true)
  })

  it('persists and broadcasts dynamic chat-room messages', async () => {
    const io = createIo()
    const socket = createSocket({ rooms: ['chat:8'] })
    registerTestChatHandlers(io, socket, {
      chatRooms: {
        createMessage: async (user, payload) => ({
          id: 99,
          message: payload.message,
          recipient: payload.recipient,
          user: { id: user.id, username: user.username },
        }),
        listActiveMemberUserIds: async () => [1, 2],
        parseChatRoomRecipientId: () => 8,
      },
    })

    await socket.handlers['chat:message']({
      recipient: 'chat:8',
      message: 'hello channel',
    })

    assert.deepEqual(io.emissions, [
      {
        event: 'chat:message',
        room: 'user:1',
        payload: {
          id: 99,
          message: 'hello channel',
          recipient: 'chat:8',
          user: { id: 1, username: 'sender' },
        },
      },
      {
        event: 'chat:message',
        room: 'user:2',
        payload: {
          id: 99,
          message: 'hello channel',
          recipient: 'chat:8',
          user: { id: 1, username: 'sender' },
        },
      },
    ])
  })

  it('supports socket chat-room creation and joins the new room', async () => {
    const io = createIo()
    const socket = createSocket()
    registerTestChatHandlers(io, socket)

    await socket.handlers['chat:room_create']({
      name: 'Strategy',
      visibility: 'PUBLIC',
    })

    assert.equal(socket.rooms.has('chat:8'), true)
    assert.deepEqual(socket.emissions, [
      {
        event: 'chat:room',
        payload: { id: 8, socketRoom: 'chat:8', name: 'Room 8' },
      },
      {
        event: 'chat:rooms',
        payload: { rooms: [] },
      },
    ])
  })
})
