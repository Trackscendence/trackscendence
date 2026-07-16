import { create } from 'zustand'
import { socket } from '@/services/socket'
import { SOCKET_EVENTS } from '@/services/socketEvents'
import { DEV_GAME_ID } from '@/dev/DevControls/constants'
import useAuthStore from './useAuthStore'
import useChatStore, { isPrivateRoomId } from './useChatStore'
import useDirectMessageStore from './useDirectMessageStore'
import useGameStore from './useGameStore'
import useNotificationStore from './useNotificationStore'
import useSocialNotificationStore from './useSocialNotificationStore'
import useTournamentStore from './useTournamentStore'
import { createSocketSessionHandlers } from './socketSessionHandlers'
import {
  attachSocketSessionListeners,
  detachSocketSessionListeners,
} from './socketSessionListeners'

// The handler map attached to the current connection. Rebuilt on every
// connect so each map's session guard closes over THAT connection's token
// (see buildSessionHandlers); kept here so disconnect detaches the same map.
let activeSessionHandlers = null

const useSocketStore = create((set) => ({
  isConnected: false,

  setConnected: (isConnected) => set({ isConnected }),

  connect: (token) => {
    // The server authenticates the socket handshake from `socket.auth.token`,
    // so set it before connecting.
    socket.auth = token ? { token } : {}
    if (activeSessionHandlers) {
      detachSocketSessionListeners(socket, activeSessionHandlers)
    }
    activeSessionHandlers = buildSessionHandlers(token)
    attachSocketSessionListeners(socket, activeSessionHandlers)

    socket.connect()
  },

  disconnect: () => {
    if (activeSessionHandlers) {
      detachSocketSessionListeners(socket, activeSessionHandlers)
      activeSessionHandlers = null
    }

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

// Built per connection with the live stores and the two browser-coupled
// effects. The factory holds the routing (see socketSessionHandlers.js and its
// test); this is only where the real dependencies are supplied.
const buildSessionHandlers = (connectionToken) =>
  createSocketSessionHandlers({
    socketStore: useSocketStore,
    gameStore: useGameStore,
    chatStore: useChatStore,
    directMessageStore: useDirectMessageStore,
    authStore: useAuthStore,
    notificationStore: useNotificationStore,
    socialNotificationStore: useSocialNotificationStore,
    tournamentStore: useTournamentStore,
    dispatchActiveGame: (gameId) =>
      window.dispatchEvent(
        new CustomEvent('trackscendence:active-game', {
          detail: { gameId },
        }),
      ),
    isDevGame: (gameId) => import.meta.env.DEV && gameId === DEV_GAME_ID,
    // Session guard (#391): the guard closes over the token this connection
    // was opened with and compares it to the current one, so an event from a
    // previous user's connection is dropped even after a new user signs in -
    // a bare "some token exists" check would let it through.
    hasActiveSession: () =>
      Boolean(connectionToken) &&
      useAuthStore.getState().token === connectionToken,
  })

export default useSocketStore
