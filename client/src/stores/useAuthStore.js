import { create } from 'zustand'
import {
  AUTH_TOKEN_KEY,
  completeFortyTwoLogin as completeFortyTwoLoginRequest,
  completeTwoFactorLogin as completeTwoFactorLoginRequest,
  fetchCurrentUser,
  getFortyTwoLoginUrl,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/services/auth'

const applyAuthenticatedResult = (set, result) => {
  if (!result?.token || !result?.user) {
    return result
  }

  localStorage.setItem(AUTH_TOKEN_KEY, result.token)
  set({ token: result.token, user: result.user, isAuthenticated: true })

  return result
}

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  isAuthenticated: false,
  isLoading: Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),
  // Build-time flag: flipped on once the server has its 42 credentials, so
  // the button stays in its "Soon" state on environments without them.
  isFortyTwoLoginEnabled: import.meta.env.VITE_FORTYTWO_AUTH === 'true',

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
    return applyAuthenticatedResult(set, result)
  },

  completeTwoFactorLogin: async (payload) => {
    const result = await completeTwoFactorLoginRequest(payload)
    return applyAuthenticatedResult(set, result)
  },

  startFortyTwoLogin: () => {
    window.location.assign(getFortyTwoLoginUrl())
  },

  completeFortyTwoLogin: async (payload) => {
    const result = await completeFortyTwoLoginRequest(payload)
    return applyAuthenticatedResult(set, result)
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

  handleSessionExpired: (expiredToken) => {
    if (expiredToken && get().token !== expiredToken) return
    localStorage.removeItem(AUTH_TOKEN_KEY)
    set({ token: null, user: null, isAuthenticated: false })
  },

  updateUser: (user) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : user,
      isAuthenticated: Boolean(user || state.token),
    }))
  },

  refreshUser: async () => {
    const activeToken = get().token || localStorage.getItem(AUTH_TOKEN_KEY)

    if (!activeToken) {
      set({ token: null, user: null, isAuthenticated: false })
      return null
    }

    const { user } = await fetchCurrentUser(activeToken)
    set({ token: activeToken, user, isAuthenticated: true })

    return user
  },
}))

export default useAuthStore
