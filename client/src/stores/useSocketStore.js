import { create } from 'zustand'
import { socket } from '@/services/socket'
import useGameStore from './useGameStore'
import useNotificationStore from './useNotificationStore'

const handleConnect = () => useSocketStore.getState().setConnected(true)
const handleDisconnect = () => useSocketStore.getState().setConnected(false)

const handleLobbyUpdate = (data) =>
  useGameStore.getState().setLobbyCount(data.count)
const handleGameStart = (data) => {
  const { setMatch, setGamePlayers, setGameOutcome } = useGameStore.getState()
  setMatch(data)
  setGamePlayers(data.players)
  // A fresh game invalidates the previous game's outcome; without this a
  // stale 'won' would bounce the game page straight back to /results.
  setGameOutcome(null)
}
const handleGameStateUpdate = (data) =>
  useGameStore.getState().setGameState(data)
const handleGameOver = (data) => useGameStore.getState().handleGameOver(data)
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

const useSocketStore = create((set) => ({
  isConnected: false,

  setConnected: (isConnected) => set({ isConnected }),

  connect: (token) => {
    // The server authenticates the socket handshake from `socket.auth.token`,
    // so set it before connecting.
    socket.auth = token ? { token } : {}

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    socket.on('lobby_update', handleLobbyUpdate)
    socket.on('game_start', handleGameStart)
    socket.on('game_state_update', handleGameStateUpdate)
    socket.on('game_over', handleGameOver)
    socket.on('game_error', handleGameError)
    socket.on('rooms_update', handleRoomsUpdate)
    socket.on('room_error', handleRoomError)

    socket.connect()
  },

  disconnect: () => {
    socket.off('connect', handleConnect)
    socket.off('disconnect', handleDisconnect)

    socket.off('lobby_update', handleLobbyUpdate)
    socket.off('game_start', handleGameStart)
    socket.off('game_state_update', handleGameStateUpdate)
    socket.off('game_over', handleGameOver)
    socket.off('game_error', handleGameError)
    socket.off('rooms_update', handleRoomsUpdate)
    socket.off('room_error', handleRoomError)

    socket.disconnect()
    socket.auth = {}
    set({ isConnected: false })
  },
}))

export default useSocketStore
