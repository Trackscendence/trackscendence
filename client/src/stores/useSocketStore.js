import { create } from 'zustand'
import { socket } from '@/services/socket'
import useGameStore from './useGameStore'

const handleConnect = () => useSocketStore.getState().setConnected(true)
const handleDisconnect = () => useSocketStore.getState().setConnected(false)

const handleLobbyUpdate = (data) =>
  useGameStore.getState().setLobbyCount(data.count)
const handleGameStart = (data) => {
  const { setMatch, setGamePlayers } = useGameStore.getState()
  setMatch(data)
  setGamePlayers(data.players)
}
const handleGameStateUpdate = (data) =>
  useGameStore.getState().setGameState(data)
const handleGameDrawnCard = (data) => {
  // Frontend UI can animate this later. For now we log it.
  console.log('Card drawn:', data)
}
const handleGameError = (data) =>
  useGameStore.getState().setGameError(data.message)
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
    socket.on('game_drawn_card', handleGameDrawnCard)
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
    socket.off('game_drawn_card', handleGameDrawnCard)
    socket.off('game_error', handleGameError)
    socket.off('rooms_update', handleRoomsUpdate)
    socket.off('room_error', handleRoomError)

    socket.disconnect()
    socket.auth = {}
    set({ isConnected: false })
  },
}))

export default useSocketStore
