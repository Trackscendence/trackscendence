import { create } from 'zustand'
import {
  AUTH_TOKEN_KEY,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/services/auth'

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  isAuthenticated: false,
  isLoading: Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),

  init: async () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!storedToken) {
      set({ isLoading: false })
      return
    }

    try {
      const { user } = await fetchCurrentUser(storedToken)
      set({ token: storedToken, user, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      set({ token: null, user: null, isAuthenticated: false, isLoading: false })
    }
  },

  register: (payload) => {
    return registerRequest(payload)
  },

  login: async (payload) => {
    const result = await loginRequest(payload)
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    set({ token: result.token, user: result.user, isAuthenticated: true })
    return result
  },

  logout: async () => {
    const activeToken = get().token || localStorage.getItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    set({ token: null, user: null, isAuthenticated: false })

    if (activeToken) {
      try {
        await logoutRequest(activeToken)
      } catch {
        // Logout is client-side for stateless bearer tokens.
      }
    }
  },

  handleSessionExpired: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

export default useAuthStore
