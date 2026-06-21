import { create } from 'zustand'

const useChatStore = create((set) => ({
  rooms: [],
  messages: {},
  activeRoom: null,

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
