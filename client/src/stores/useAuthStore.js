import { create } from 'zustand'
import {
  AUTH_TOKEN_KEY,
  completeFortyTwoLogin as completeFortyTwoLoginRequest,
  completeTwoFactorLogin as completeTwoFactorLoginRequest,
  fetchAuthProviders,
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
  // The server reports which OAuth providers it has credentials for, so the
  // 42 button enables itself exactly where the flow can actually work. It
  // starts in the "Soon" state until the first successful probe.
  isFortyTwoLoginEnabled: false,

  // Probes the server for available OAuth providers. Safe to call repeatedly:
  // the auth pages re-run it on mount so a transient failure at startup (e.g.
  // the probe racing the server coming up) self-heals the next time the login
  // or signup screen is shown, rather than leaving the 42 button stuck on
  // "Soon" for the whole session.
  loadAuthProviders: async () => {
    try {
      const { providers } = await fetchAuthProviders()
      set({ isFortyTwoLoginEnabled: Boolean(providers?.fortyTwo) })
    } catch {
      // Keep the current state; a later probe will retry.
    }
  },

  init: async () => {
    get().loadAuthProviders()

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
