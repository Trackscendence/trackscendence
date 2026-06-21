import { create } from 'zustand'

let nextId = 0

const useNotificationStore = create((set) => ({
  notifications: [],

  push: (message, type = 'info') => {
    const id = ++nextId
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))
    return id
  },

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clear: () => set({ notifications: [] }),
}))

export default useNotificationStore
