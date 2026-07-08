import { create } from 'zustand'
import { socket } from '@/services/socket'
import { SOCKET_EVENTS } from '@/services/socketEvents'
import { DEV_GAME_ID } from '@/dev/DevControls/constants'
import useAuthStore from './useAuthStore'
import useChatStore, { isPrivateRoomId } from './useChatStore'
import useGameStore from './useGameStore'
import useNotificationStore from './useNotificationStore'
import { createSocketSessionHandlers } from './socketSessionHandlers'
import {
  attachSocketSessionListeners,
  detachSocketSessionListeners,
} from './socketSessionListeners'

const useSocketStore = create((set) => ({
  isConnected: false,

  setConnected: (isConnected) => set({ isConnected }),

  connect: (token) => {
    // The server authenticates the socket handshake from `socket.auth.token`,
    // so set it before connecting.
    socket.auth = token ? { token } : {}
    attachSocketSessionListeners(socket, sessionHandlers)

    socket.connect()
  },

  disconnect: () => {
    detachSocketSessionListeners(socket, sessionHandlers)

    socket.disconnect()
    socket.auth = {}
    set({ isConnected: false })
  },

  sendChatMessage: (message, recipient) => {
    const text = message.trim()
    if (!text || typeof recipient !== 'string' || !recipient) return false

    const event = isPrivateRoomId(recipient)
      ? SOCKET_EVENTS.CHAT_PRIVATE_MESSAGE
      : SOCKET_EVENTS.CHAT_MESSAGE

    socket.emit(event, {
      message: text,
      recipient,
    })

    return true
  },
}))

// Built once with the live stores and the two browser-coupled effects. The
// factory holds the routing (see socketSessionHandlers.js and its test); this is
// only where the real dependencies are supplied.
const sessionHandlers = createSocketSessionHandlers({
  socketStore: useSocketStore,
  gameStore: useGameStore,
  chatStore: useChatStore,
  authStore: useAuthStore,
  notificationStore: useNotificationStore,
  dispatchActiveGame: (gameId) =>
    window.dispatchEvent(
      new CustomEvent('trackscendence:active-game', {
        detail: { gameId },
      }),
    ),
  isDevGame: (gameId) => import.meta.env.DEV && gameId === DEV_GAME_ID,
})

export default useSocketStore
