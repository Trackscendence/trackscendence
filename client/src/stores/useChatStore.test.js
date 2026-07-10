import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import useChatStore, {
  GENERAL_CHAT_ROOM_ID,
  getChatRoomId,
  getGameRoomId,
  getPrivateRoomId,
  isPrivateRoomId,
} from './useChatStore.js'
import { resetSessionStores } from './createSessionStore.js'
import { setStoredToken, clearStoredToken } from '../services/tokenStorage.js'

// node has no localStorage, so back tokenStorage with an in-memory shim. The
// socket message handlers are session-guarded (#391), so tests run against a
// signed-in session unless they clear it on purpose.
const storage = new Map()
globalThis.localStorage = globalThis.localStorage || {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}

beforeEach(() => {
  setStoredToken('session-token')
})

test('starts in the general chat room', () => {
  useChatStore.getState().reset()

  const state = useChatStore.getState()

  assert.equal(state.activeRoom, GENERAL_CHAT_ROOM_ID)
  assert.deepEqual(Object.keys(state.rooms), [GENERAL_CHAT_ROOM_ID])
})

test('syncs friend rooms while preserving messages for rooms that remain', () => {
  useChatStore.getState().reset()
  useChatStore.getState().syncFriendRooms([
    {
      user: {
        id: 7,
        username: 'friend7',
        displayName: 'Friend Seven',
      },
    },
  ])
  const roomId = getPrivateRoomId(7)
  useChatStore.getState().addMessage(roomId, {
    message: 'hello',
    user: { id: 7, username: 'friend7' },
  })

  useChatStore.getState().syncFriendRooms([
    {
      user: {
        id: 7,
        username: 'friend7',
        displayName: 'Friend Seven',
      },
    },
  ])

  const state = useChatStore.getState()

  assert.equal(state.rooms[roomId].name, 'Friend Seven')
  assert.equal(state.messages[roomId][0].message, 'hello')
})

test('falls back to general when the active friend room disappears', () => {
  useChatStore.getState().reset()
  useChatStore.getState().syncFriendRooms([
    {
      user: {
        id: 4,
        username: 'friend4',
      },
    },
  ])
  useChatStore.getState().setActiveRoom(getPrivateRoomId(4))

  useChatStore.getState().syncFriendRooms([])

  assert.equal(useChatStore.getState().activeRoom, GENERAL_CHAT_ROOM_ID)
})

test('identifies private chat rooms', () => {
  assert.equal(isPrivateRoomId(getPrivateRoomId(12)), true)
  assert.equal(isPrivateRoomId(GENERAL_CHAT_ROOM_ID), false)
})

test('syncs dynamic chat rooms with membership state', () => {
  useChatStore.getState().reset()

  useChatStore.getState().syncChatRooms([
    {
      id: 5,
      socketRoom: getChatRoomId(5),
      name: 'Strategy',
      visibility: 'INVITE_ONLY',
      isJoined: true,
      isAdmin: true,
      isInvited: false,
      membership: { isMuted: false, role: 'ADMIN', status: 'ACTIVE' },
      members: [],
    },
  ])

  const room = useChatStore.getState().rooms[getChatRoomId(5)]

  assert.equal(room.type, 'chat')
  assert.equal(room.chatRoomId, 5)
  assert.equal(room.name, 'Strategy')
  assert.equal(room.isJoined, true)
  assert.equal(room.isAdmin, true)
})

test('preserves dynamic chat-room messages across room sync', () => {
  useChatStore.getState().reset()
  const roomId = getChatRoomId(6)

  useChatStore.getState().syncChatRooms([
    {
      id: 6,
      socketRoom: roomId,
      name: 'Lobby',
      visibility: 'PUBLIC',
      isJoined: true,
      membership: { isMuted: false, role: 'MEMBER', status: 'ACTIVE' },
      members: [],
    },
  ])
  useChatStore.getState().addMessage(roomId, {
    message: 'saved locally',
    user: { id: 1, username: 'me' },
  })
  useChatStore.getState().syncChatRooms([
    {
      id: 6,
      socketRoom: roomId,
      name: 'Lobby',
      visibility: 'PUBLIC',
      isJoined: true,
      membership: { isMuted: false, role: 'MEMBER', status: 'ACTIVE' },
      members: [],
    },
  ])

  assert.equal(
    useChatStore.getState().messages[roomId][0].message,
    'saved locally',
  )
})

test('routes private message echoes to the selected friend room', () => {
  useChatStore.getState().reset()
  const roomId = getPrivateRoomId(8)

  useChatStore.getState().receivePrivateMessage(
    {
      recipient: roomId,
      message: 'hello',
      user: { id: 3, username: 'me' },
    },
    3,
  )

  const state = useChatStore.getState()

  assert.equal(state.messages[roomId][0].message, 'hello')
})

test('routes incoming private messages to the sender room', () => {
  useChatStore.getState().reset()

  useChatStore.getState().receivePrivateMessage(
    {
      recipient: getPrivateRoomId(3),
      message: 'hi back',
      user: { id: 8, username: 'friend8', displayName: 'Friend Eight' },
    },
    3,
  )

  const state = useChatStore.getState()
  const roomId = getPrivateRoomId(8)

  assert.equal(state.rooms[roomId].name, 'Friend Eight')
  assert.equal(state.messages[roomId][0].message, 'hi back')
})

test('keeps per-room message history bounded', () => {
  useChatStore.getState().reset()

  Array.from({ length: 105 }, (_, index) => {
    useChatStore.getState().addMessage(GENERAL_CHAT_ROOM_ID, {
      message: `message-${index}`,
      user: { id: 1, username: 'sender' },
    })
  })

  const messages = useChatStore.getState().messages[GENERAL_CHAT_ROOM_ID]

  assert.equal(messages.length, 100)
  assert.equal(messages[0].message, 'message-5')
})

test('stores and clears game-room messages', () => {
  useChatStore.getState().reset()
  const roomId = getGameRoomId('game-1')

  useChatStore.getState().receiveRoomMessage({
    recipient: roomId,
    message: 'table talk',
    user: { id: 2, username: 'player2' },
  })

  assert.equal(
    useChatStore.getState().messages[roomId][0].message,
    'table talk',
  )

  useChatStore.getState().clearRoomMessages(roomId)

  assert.equal(useChatStore.getState().messages[roomId], undefined)
})

test('session teardown clears chat data back to defaults', () => {
  useChatStore.getState().reset()
  useChatStore.getState().receiveRoomMessage({
    message: 'previous user chatter',
    user: { id: 2, username: 'player2' },
  })

  resetSessionStores()

  const state = useChatStore.getState()
  assert.deepEqual(state.messages[GENERAL_CHAT_ROOM_ID], [])
  assert.deepEqual(Object.keys(state.rooms), [GENERAL_CHAT_ROOM_ID])
})

test('socket chat messages are dropped once the session has ended', () => {
  useChatStore.getState().reset()
  clearStoredToken()

  useChatStore.getState().receiveRoomMessage({
    message: 'late room message after logout',
    user: { id: 2, username: 'player2' },
  })
  useChatStore.getState().receivePrivateMessage(
    {
      recipient: getPrivateRoomId(3),
      message: 'late private message after logout',
      user: { id: 8, username: 'friend8' },
    },
    3,
  )

  const state = useChatStore.getState()
  assert.deepEqual(state.messages[GENERAL_CHAT_ROOM_ID], [])
  assert.equal(state.messages[getPrivateRoomId(8)], undefined)
})
