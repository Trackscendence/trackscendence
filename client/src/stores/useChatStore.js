import { create } from 'zustand'

const useChatStore = create((set) => ({
  rooms: {
    'channel:#general': {
      name: '#General',
    },
  },
  messages: {
    'channel:#general': [],
  },
  activeRoom: 'channel:#general',

  addRoom: (roomId, roomName) =>
    set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: { name: roomName },
      },
      messages: {
        ...state.messages,
        [roomId]: state.messages[roomId] || [],
      },
    })),
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),
  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),
}))

export default useChatStore
