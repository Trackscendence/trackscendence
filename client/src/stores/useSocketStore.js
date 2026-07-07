import { create } from 'zustand'
import { socket } from '@/services/socket'
import { DEV_GAME_ID } from '@/dev/DevControls/constants'
import useAuthStore from './useAuthStore'
import useChatStore, { isPrivateRoomId } from './useChatStore'
import useGameStore from './useGameStore'
import useNotificationStore from './useNotificationStore'
import {
  attachSocketSessionListeners,
  detachSocketSessionListeners,
} from './socketSessionListeners'

const handleConnect = () => {
  useSocketStore.getState().setConnected(true)
  // A reconnected socket missed every broadcast while it was down: replay
  // the running game's state, if any. Dev-rigged games (the Rig's sim and
  // mock ids) exist only in this client, so the server is never asked about
  // them; the check erases from production builds with the dev import.
  const { gameState, requestGameState } = useGameStore.getState()
  if (!gameState?.gameId) return
  if (import.meta.env.DEV && gameState.gameId === DEV_GAME_ID) return
  requestGameState(gameState.gameId)
}
const handleDisconnect = () => useSocketStore.getState().setConnected(false)

const handleLobbyUpdate = (data) =>
  useGameStore.getState().setLobbyCount(data.count)
const handleGameStart = (data) => {
  const { setMatch, setGamePlayers, setGameOutcome, setPausedGame } =
    useGameStore.getState()
  setMatch(data)
  setGamePlayers(data.players)
  // A fresh game invalidates the previous game's outcome; without this a
  // stale 'won' would bounce the game page straight back to /results.
  setGameOutcome(null)
  // A brand-new game is never mid-pause, so drop any leftover overlay.
  setPausedGame(null)
}
const handleGameStateUpdate = (data) =>
  useGameStore.getState().setGameState(data)
const handleGameOver = (data) => useGameStore.getState().handleGameOver(data)
// A player dropped mid-game (game_paused) or made it back (game_resumed); the
// Game page covers the table with a countdown while the pause is set.
const handleGamePaused = (data) => useGameStore.getState().setPausedGame(data)
const handleGameResumed = () => useGameStore.getState().setPausedGame(null)
// On connect the server reports any game still in progress for this user. Relay
// it as an app-level event so App can route a freshly-landed client back into
// the game instead of leaving it stranded in the lobby (mirrors how the request
// utility signals session expiry).
const handleActiveGame = (data) => {
  if (!data?.gameId) return
  window.dispatchEvent(
    new CustomEvent('trackscendence:active-game', {
      detail: { gameId: data.gameId },
    }),
  )
}
// A rejected move (out of turn, illegal card, missing game). The next
// game_state_update reconciles the table, so a toast is all the user needs.
const handleGameError = (data) => {
  const message = data?.message || 'The move was rejected'
  useGameStore.getState().setGameError(message)
  useNotificationStore.getState().push(message, 'error')
}
const handleRoomsUpdate = (data) => useGameStore.getState().setRooms(data)
const handleRoomError = (data) =>
  useGameStore.getState().setRoomError(data.message)
// The owner ended the room this player was seated in (#221); the waiting room
// watches roomClosed and returns to the lobby.
const handleRoomClosed = () => useGameStore.getState().setRoomClosed(true)
const handleChatMessage = (data) =>
  useChatStore.getState().receiveRoomMessage(data)
const handlePrivateChatMessage = (data) =>
  useChatStore
    .getState()
    .receivePrivateMessage(data, useAuthStore.getState().user?.id)
const handleChatRooms = (data) => {
  if (Array.isArray(data?.rooms)) {
    useChatStore.getState().syncChatRooms(data.rooms)
  }
}
const handleChatError = (data) => {
  useNotificationStore
    .getState()
    .push(data?.message || 'Unable to send chat message', 'error')
}

const socketSessionHandlers = {
  connect: handleConnect,
  disconnect: handleDisconnect,
  lobby_update: handleLobbyUpdate,
  game_start: handleGameStart,
  game_state_update: handleGameStateUpdate,
  game_over: handleGameOver,
  game_paused: handleGamePaused,
  game_resumed: handleGameResumed,
  active_game: handleActiveGame,
  game_error: handleGameError,
  rooms_update: handleRoomsUpdate,
  room_error: handleRoomError,
  'room:closed': handleRoomClosed,
  'chat:message': handleChatMessage,
  'chat:private_message': handlePrivateChatMessage,
  'chat:rooms': handleChatRooms,
  'chat:error': handleChatError,
}

const useSocketStore = create((set) => ({
  isConnected: false,

  setConnected: (isConnected) => set({ isConnected }),

  connect: (token) => {
    // The server authenticates the socket handshake from `socket.auth.token`,
    // so set it before connecting.
    socket.auth = token ? { token } : {}
    attachSocketSessionListeners(socket, socketSessionHandlers)

    socket.connect()
  },

  disconnect: () => {
    detachSocketSessionListeners(socket, socketSessionHandlers)

    socket.disconnect()
    socket.auth = {}
    set({ isConnected: false })
  },

  sendChatMessage: (message, recipient) => {
    const text = message.trim()
    if (!text || typeof recipient !== 'string' || !recipient) return false

    const event = isPrivateRoomId(recipient)
      ? 'chat:private_message'
      : 'chat:message'

    socket.emit(event, {
      message: text,
      recipient,
    })

    return true
  },
}))

export default useSocketStore
