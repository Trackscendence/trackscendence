import assert from 'node:assert/strict'
import test from 'node:test'
import { createSocketSessionHandlers } from './socketSessionHandlers.js'
import { SOCKET_EVENTS } from '../services/socketEvents.js'

// Fake stores whose getState() returns recorders, so we can assert which action
// each incoming socket event routes to without a socket, a window, or a renderer.
const makeDeps = ({
  userId = null,
  gameState,
  watchingRooms = false,
  isDevGame = () => false,
} = {}) => {
  const calls = {}
  const rec =
    (name) =>
    (...args) => {
      ;(calls[name] ??= []).push(args)
    }

  const deps = {
    socketStore: { getState: () => ({ setConnected: rec('setConnected') }) },
    gameStore: {
      getState: () => ({
        setLobbyCount: rec('setLobbyCount'),
        setMatch: rec('setMatch'),
        setGamePlayers: rec('setGamePlayers'),
        setGameOutcome: rec('setGameOutcome'),
        setPausedGame: rec('setPausedGame'),
        setGameState: rec('setGameState'),
        handleGameOver: rec('handleGameOver'),
        setGameError: rec('setGameError'),
        setRooms: rec('setRooms'),
        setRoomError: rec('setRoomError'),
        setRoomClosed: rec('setRoomClosed'),
        watchRooms: rec('watchRooms'),
        listRooms: rec('listRooms'),
        requestGameState: rec('requestGameState'),
        gameState,
        watchingRooms,
      }),
    },
    chatStore: {
      getState: () => ({
        receiveRoomMessage: rec('receiveRoomMessage'),
        receivePrivateMessage: rec('receivePrivateMessage'),
        syncChatRooms: rec('syncChatRooms'),
      }),
    },
    directMessageStore: {
      getState: () => ({
        markConversationReadByFriend: rec('markConversationReadByFriend'),
        receiveMessage: rec('receiveDirectMessage'),
      }),
    },
    authStore: {
      getState: () => ({ user: userId == null ? null : { id: userId } }),
    },
    notificationStore: { getState: () => ({ push: rec('push') }) },
    socialNotificationStore: {
      getState: () => ({
        loadNotifications: rec('loadSocialNotifications'),
      }),
    },
    dispatchActiveGame: rec('dispatchActiveGame'),
    isDevGame,
  }

  return { deps, calls }
}

test('registers a handler for every event the server can send', () => {
  const { deps } = makeDeps()
  const handlers = createSocketSessionHandlers(deps)

  const expected = [
    SOCKET_EVENTS.CONNECT,
    SOCKET_EVENTS.DISCONNECT,
    SOCKET_EVENTS.LOBBY_UPDATE,
    SOCKET_EVENTS.GAME_START,
    SOCKET_EVENTS.GAME_STATE_UPDATE,
    SOCKET_EVENTS.GAME_OVER,
    SOCKET_EVENTS.GAME_PAUSED,
    SOCKET_EVENTS.GAME_RESUMED,
    SOCKET_EVENTS.UNO_CAUGHT,
    SOCKET_EVENTS.ACTIVE_GAME,
    SOCKET_EVENTS.GAME_ERROR,
    SOCKET_EVENTS.ROOMS_UPDATE,
    SOCKET_EVENTS.ROOM_ERROR,
    SOCKET_EVENTS.ROOM_CLOSED,
    SOCKET_EVENTS.CHAT_CONVERSATION_READ,
    SOCKET_EVENTS.CHAT_MESSAGE,
    SOCKET_EVENTS.CHAT_PRIVATE_MESSAGE,
    SOCKET_EVENTS.CHAT_ROOMS,
    SOCKET_EVENTS.CHAT_ERROR,
  ]
  assert.deepEqual(Object.keys(handlers).sort(), [...expected].sort())
  Object.values(handlers).forEach((handler) =>
    assert.equal(typeof handler, 'function'),
  )
})

test('game_state_update routes to setGameState with the payload', () => {
  const { deps, calls } = makeDeps()
  const handlers = createSocketSessionHandlers(deps)
  const data = { gameId: 'g1' }

  handlers[SOCKET_EVENTS.GAME_STATE_UPDATE](data)

  assert.deepEqual(calls.setGameState, [[data]])
})

test('game_over routes to handleGameOver, lobby_update to setLobbyCount', () => {
  const { deps, calls } = makeDeps()
  const handlers = createSocketSessionHandlers(deps)

  handlers[SOCKET_EVENTS.GAME_OVER]({ winnerUserId: 3 })
  handlers[SOCKET_EVENTS.LOBBY_UPDATE]({ count: 5 })

  assert.deepEqual(calls.handleGameOver, [[{ winnerUserId: 3 }]])
  assert.deepEqual(calls.setLobbyCount, [[5]])
})

test('game_error sets the game error and pushes an error toast, with a default message', () => {
  const { deps, calls } = makeDeps()
  const handlers = createSocketSessionHandlers(deps)

  handlers[SOCKET_EVENTS.GAME_ERROR]({ message: 'Not your turn' })
  handlers[SOCKET_EVENTS.GAME_ERROR]({})

  assert.deepEqual(calls.setGameError, [
    ['Not your turn'],
    ['The move was rejected'],
  ])
  assert.deepEqual(calls.push, [
    ['Not your turn', 'error'],
    ['The move was rejected', 'error'],
  ])
})

test('game_start seeds the match and clears stale outcome/pause', () => {
  const { deps, calls } = makeDeps()
  const handlers = createSocketSessionHandlers(deps)
  const data = { gameId: 'g1', players: [{ userId: 1 }] }

  handlers[SOCKET_EVENTS.GAME_START](data)

  assert.deepEqual(calls.setMatch, [[data]])
  assert.deepEqual(calls.setGamePlayers, [[data.players]])
  assert.deepEqual(calls.setGameOutcome, [[null]])
  assert.deepEqual(calls.setPausedGame, [[null]])
})

test('connect re-watches rooms and replays a running game, but skips a dev game', () => {
  const running = makeDeps({
    watchingRooms: true,
    gameState: { gameId: 'g9' },
  })
  createSocketSessionHandlers(running.deps)[SOCKET_EVENTS.CONNECT]()
  assert.deepEqual(running.calls.setConnected, [[true]])
  assert.deepEqual(running.calls.watchRooms, [[]])
  assert.deepEqual(running.calls.listRooms, [[]])
  assert.deepEqual(running.calls.requestGameState, [['g9']])

  const dev = makeDeps({
    gameState: { gameId: 'dev' },
    isDevGame: (id) => id === 'dev',
  })
  createSocketSessionHandlers(dev.deps)[SOCKET_EVENTS.CONNECT]()
  assert.equal(dev.calls.requestGameState, undefined)
})

test('disconnect flips connected to false', () => {
  const { deps, calls } = makeDeps()
  createSocketSessionHandlers(deps)[SOCKET_EVENTS.DISCONNECT]()
  assert.deepEqual(calls.setConnected, [[false]])
})

test('uno_caught notifies the caught player and the catcher', () => {
  const caught = makeDeps({ userId: 7 })
  createSocketSessionHandlers(caught.deps)[SOCKET_EVENTS.UNO_CAUGHT]({
    targetUserId: 7,
    byUserId: 9,
  })
  assert.equal(caught.calls.push[0][1], 'error')

  const catcher = makeDeps({ userId: 9 })
  createSocketSessionHandlers(catcher.deps)[SOCKET_EVENTS.UNO_CAUGHT]({
    targetUserId: 7,
    byUserId: 9,
  })
  assert.equal(catcher.calls.push[0][1], 'success')

  const bystander = makeDeps({ userId: 1 })
  createSocketSessionHandlers(bystander.deps)[SOCKET_EVENTS.UNO_CAUGHT]({
    targetUserId: 7,
    byUserId: 9,
  })
  assert.equal(bystander.calls.push, undefined)
})

test('active_game dispatches only when a gameId is present', () => {
  const withId = makeDeps()
  createSocketSessionHandlers(withId.deps)[SOCKET_EVENTS.ACTIVE_GAME]({
    gameId: 'g3',
  })
  assert.deepEqual(withId.calls.dispatchActiveGame, [['g3']])

  const withoutId = makeDeps()
  createSocketSessionHandlers(withoutId.deps)[SOCKET_EVENTS.ACTIVE_GAME]({})
  assert.equal(withoutId.calls.dispatchActiveGame, undefined)
})

test('chat events route to the chat store, passing the current user id on private messages', () => {
  const { deps, calls } = makeDeps({ userId: 42 })
  const handlers = createSocketSessionHandlers(deps)

  handlers[SOCKET_EVENTS.CHAT_MESSAGE]({ text: 'hi' })
  handlers[SOCKET_EVENTS.CHAT_PRIVATE_MESSAGE]({ text: 'psst' })
  handlers[SOCKET_EVENTS.CHAT_CONVERSATION_READ]({
    conversationId: 7,
    readAt: '2026-07-09T12:00:00.000Z',
  })
  handlers[SOCKET_EVENTS.CHAT_ROOMS]({ rooms: [{ id: 'r1' }] })

  assert.deepEqual(calls.receiveRoomMessage, [[{ text: 'hi' }]])
  assert.deepEqual(calls.receivePrivateMessage, [[{ text: 'psst' }, 42]])
  assert.deepEqual(calls.receiveDirectMessage, [[{ text: 'psst' }, 42]])
  assert.deepEqual(calls.markConversationReadByFriend, [
    [{ conversationId: 7, readAt: '2026-07-09T12:00:00.000Z' }],
  ])
  assert.deepEqual(calls.loadSocialNotifications, [[]])
  assert.deepEqual(calls.syncChatRooms, [[[{ id: 'r1' }]]])
})

test('room:closed coerces a numeric roomId and falls back to true', () => {
  const numeric = makeDeps()
  createSocketSessionHandlers(numeric.deps)[SOCKET_EVENTS.ROOM_CLOSED]({
    roomId: '12',
  })
  assert.deepEqual(numeric.calls.setRoomClosed, [[12]])

  const missing = makeDeps()
  createSocketSessionHandlers(missing.deps)[SOCKET_EVENTS.ROOM_CLOSED]({})
  assert.deepEqual(missing.calls.setRoomClosed, [[true]])
})

test('session-data events are dropped once the session has ended (#391)', () => {
  const { deps, calls } = makeDeps({ userId: 42 })
  const handlers = createSocketSessionHandlers({
    ...deps,
    hasActiveSession: () => false,
  })

  handlers[SOCKET_EVENTS.LOBBY_UPDATE]({ count: 3 })
  handlers[SOCKET_EVENTS.GAME_STATE_UPDATE]({ gameId: 'g1' })
  handlers[SOCKET_EVENTS.ROOMS_UPDATE]([{ id: 1 }])
  handlers[SOCKET_EVENTS.CHAT_MESSAGE]({ text: 'late' })
  handlers[SOCKET_EVENTS.CHAT_PRIVATE_MESSAGE]({ text: 'late psst' })
  handlers[SOCKET_EVENTS.CHAT_CONVERSATION_READ]({
    conversationId: 7,
    readAt: '2026-07-09T12:00:00.000Z',
  })

  assert.equal(calls.setLobbyCount, undefined)
  assert.equal(calls.setGameState, undefined)
  assert.equal(calls.setRooms, undefined)
  assert.equal(calls.receiveRoomMessage, undefined)
  assert.equal(calls.receivePrivateMessage, undefined)
  assert.equal(calls.markConversationReadByFriend, undefined)

  // Transport-state events stay live so isConnected remains accurate.
  handlers[SOCKET_EVENTS.DISCONNECT]()
  assert.deepEqual(calls.setConnected, [[false]])
})
