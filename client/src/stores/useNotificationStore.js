import { create } from 'zustand'

let nextId = 0
const timers = new Map()
const DEFAULT_DURATION_MS = 5000

const clearTimer = (id) => {
  const timer = timers.get(id)

  if (!timer) return

  clearTimeout(timer)
  timers.delete(id)
}

const useNotificationStore = create((set) => ({
  notifications: [],

  push: (message, type = 'info', options = {}) => {
    const id = ++nextId
    const durationMs = options.durationMs ?? DEFAULT_DURATION_MS

    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))

    if (durationMs > 0) {
      const timer = setTimeout(() => {
        timers.delete(id)
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      }, durationMs)

      timers.set(id, timer)
    }

    return id
  },

  dismiss: (id) => {
    clearTimer(id)

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clear: () => {
    timers.forEach(clearTimeout)
    timers.clear()
    set({ notifications: [] })
  },
}))

export default useNotificationStore
