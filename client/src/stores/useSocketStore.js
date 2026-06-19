import { create } from 'zustand'
import { socket } from '@/services/socket'

const handleConnect = () => useSocketStore.getState().setConnected(true)
const handleDisconnect = () => useSocketStore.getState().setConnected(false)

const useSocketStore = create((set) => ({
  isConnected: false,

  setConnected: (isConnected) => set({ isConnected }),

  connect: () => {
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.connect()
  },

  disconnect: () => {
    socket.off('connect', handleConnect)
    socket.off('disconnect', handleDisconnect)
    socket.disconnect()
    set({ isConnected: false })
  },
}))

export default useSocketStore
