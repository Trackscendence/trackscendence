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

// How hard a provider probe retries while the request keeps failing. Right
// after the stack starts the client is served before the API can answer, so
// the first probes fail; ~8 attempts a couple of seconds apart covers the boot
// window without hammering.
const PROVIDERS_PROBE_MAX_ATTEMPTS = 8
const PROVIDERS_PROBE_RETRY_MS = 1500

// Tracks the current in-flight probe so overlapping callers (app init plus the
// auth pages re-checking on mount) share one retry loop instead of each running
// their own.
let providersProbe = null

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  isAuthenticated: false,
  isLoading: Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),
  // The server reports which OAuth providers it has credentials for, so the
  // 42 button enables itself exactly where the flow can actually work. It
  // starts in the "Soon" state until the first successful probe.
  isFortyTwoLoginEnabled: false,

  // Probes the server for available OAuth providers and flips the 42 button on
  // where the flow can actually work. The probe races the API coming up right
  // after the stack starts, so a *failed* request is retried a few times before
  // giving up — otherwise the button stays stuck on "Soon" for the whole
  // session until a manual refresh. A request that *succeeds* is authoritative,
  // including one that reports 42 as not configured, so it stops retrying now.
  // Concurrent callers share the in-flight probe rather than each looping.
  loadAuthProviders: () => {
    if (providersProbe) return providersProbe

    providersProbe = (async () => {
      for (
        let attempt = 1;
        attempt <= PROVIDERS_PROBE_MAX_ATTEMPTS;
        attempt += 1
      ) {
        try {
          const { providers } = await fetchAuthProviders()
          set({ isFortyTwoLoginEnabled: Boolean(providers?.fortyTwo) })
          return
        } catch {
          // The server is likely still starting up; wait and try again.
          if (attempt < PROVIDERS_PROBE_MAX_ATTEMPTS) {
            await delay(PROVIDERS_PROBE_RETRY_MS)
          }
        }
      }
    })()

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
