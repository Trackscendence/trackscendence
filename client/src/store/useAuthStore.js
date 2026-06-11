import { create } from 'zustand'
import {
  AUTH_TOKEN_KEY,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../services/auth'

const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

const useAuthStore = create((set, get) => ({
  token: getStoredToken(),
  user: null,
  isLoading: Boolean(getStoredToken()),
  isAuthenticated: false,

  init: async () => {
    const token = get().token
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const { user } = await fetchCurrentUser(token)
      set({ user, isLoading: false, isAuthenticated: true })
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      set({ token: null, user: null, isLoading: false, isAuthenticated: false })
    }
  },

  register: async (payload) => {
    return registerRequest(payload)
  },

  login: async (payload) => {
    const result = await loginRequest(payload)
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    set({ token: result.token, user: result.user, isAuthenticated: true })
    return result
  },

  logout: async () => {
    const activeToken = get().token || getStoredToken()

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
}))

export default useAuthStore
