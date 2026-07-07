import { create } from 'zustand'
import {
  AUTH_TOKEN_KEY,
  completeFortyTwoLogin as completeFortyTwoLoginRequest,
  completeTwoFactorLogin as completeTwoFactorLoginRequest,
  fetchAuthProviders,
  fetchCurrentUser,
  getFortyTwoLoginUrl,
  login as loginRequest,
  loginAsGuest as loginAsGuestRequest,
  logout as logoutRequest,
  register as registerRequest,
  upgradeGuestAccount as upgradeGuestAccountRequest,
} from '@/services/auth'
import { loadAuthProvidersWithRetry } from './authProvidersProbe'

const applyAuthenticatedResult = (set, result) => {
  if (!result?.token || !result?.user) {
    return result
  }

  localStorage.setItem(AUTH_TOKEN_KEY, result.token)
  set({ token: result.token, user: result.user, isAuthenticated: true })

  return result
}

// Tracks the current in-flight probe so overlapping callers (app init plus the
// auth pages re-checking on mount) share one retry loop instead of each running
// their own.
let providersProbe = null

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  isAuthenticated: false,
  isLoading: Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),
  // The server reports which OAuth providers it has credentials for, so the
  // 42 button enables itself exactly where the flow can actually work. It
  // starts in a checking state until the first successful probe.
  isFortyTwoLoginEnabled: false,
  isAuthProvidersLoading: true,

  // Probes the server for available OAuth providers and flips the 42 button on
  // where the flow can actually work. The probe races the API coming up after
  // docker compose starts, so failed requests keep retrying long enough to
  // cover server install, migration, and seed time. A successful request is
  // authoritative, including one that reports 42 as not configured.
  loadAuthProviders: () => {
    if (providersProbe) return providersProbe

    providersProbe = loadAuthProvidersWithRetry({
      fetchAuthProviders,
      set,
    })

    providersProbe.finally(() => {
      providersProbe = null
    })

    return providersProbe
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

  loginAsGuest: async () => {
    const result = await loginAsGuestRequest()
    return applyAuthenticatedResult(set, result)
  },

  upgradeGuestAccount: async (payload) => {
    const activeToken = get().token || localStorage.getItem(AUTH_TOKEN_KEY)

    if (!activeToken) {
      throw new Error('Authentication required')
    }

    const result = await upgradeGuestAccountRequest(payload, activeToken)
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

  clearSession: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    set({ token: null, user: null, isAuthenticated: false, isLoading: false })
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
