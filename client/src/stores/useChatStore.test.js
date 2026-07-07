import assert from 'node:assert/strict'
import test from 'node:test'
import useChatStore, {
  GENERAL_CHAT_ROOM_ID,
  getGameRoomId,
  getPrivateRoomId,
  isPrivateRoomId,
} from './useChatStore.js'

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
