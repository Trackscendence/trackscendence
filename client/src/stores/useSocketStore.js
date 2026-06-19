import { create } from 'zustand'
import { socket } from '@/services/socket'

const useSocketStore = create((set) => ({
  isConnected: false,

  connect: () => {
    socket.connect()
    socket.on('connect', () => set({ isConnected: true }))
    socket.on('disconnect', () => set({ isConnected: false }))
  },

  disconnect: () => {
    socket.off('connect')
    socket.off('disconnect')
    socket.disconnect()
    set({ isConnected: false })
  },
}))

export default useSocketStore
