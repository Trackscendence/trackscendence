import { searchUsers } from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'
import { createSessionStore } from './createSessionStore'
import { isActiveToken } from './sessionGuard'

// Search state is keyed by scope so every mounted search box reads and
// writes only its own slice: one box can never clear or reorder another
// box's results. Request ids are per scope for the same reason; they are
// monotonic so a slow, older response cannot overwrite a newer one. The
// session guard is the cross-session complement: it drops a response whose
// session ended mid-flight (#391).
const searchRequestIdByScope = new Map()

const nextRequestId = (scope) => {
  const requestId = (searchRequestIdByScope.get(scope) || 0) + 1
  searchRequestIdByScope.set(scope, requestId)
  return requestId
}

const getScopeState = (scopes, scope) =>
  scopes[scope] || {
    results: [],
    pagination: null,
    isSearching: false,
    error: null,
    // Distinguishes "no matches" from "nothing searched yet" so the UI only
    // shows an empty state after a real search.
    hasSearched: false,
  }

// Session store (#391): holds the previous user's search results, so it is
// cleared by resetSessionStores() at teardown.
const useUserSearchStore = createSessionStore((set) => ({
  scopes: {},

  search: async (scope, { q = '', page = 1 } = {}) => {
    const requestId = nextRequestId(scope)
    const token = useAuthStore.getState().token
    set((state) => ({
      scopes: {
        ...state.scopes,
        [scope]: {
          ...getScopeState(state.scopes, scope),
          isSearching: true,
          error: null,
        },
      },
    }))
    try {
      const response = await searchUsers({ q, page }, token)
      if (searchRequestIdByScope.get(scope) !== requestId) return
      if (!isActiveToken(token)) return
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scope]: {
            results: response?.users ?? [],
            pagination: response?.pagination ?? null,
            isSearching: false,
            error: null,
            hasSearched: true,
          },
        },
      }))
    } catch (error) {
      if (searchRequestIdByScope.get(scope) !== requestId) return
      if (!isActiveToken(token)) return
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scope]: {
            ...getScopeState(state.scopes, scope),
            isSearching: false,
            error: error?.message || 'Search failed',
            hasSearched: true,
          },
        },
      }))
    }
  },

  // Clearing also invalidates any in-flight search for the scope: the id
  // bump turns a late response into a no-op instead of letting it repopulate
  // a box the user already emptied (or one that unmounted).
  clear: (scope) => {
    nextRequestId(scope)
    set((state) => {
      if (!(scope in state.scopes)) return state
      const scopes = { ...state.scopes }
      delete scopes[scope]
      return { scopes }
    })
  },

  reset: () => {
    // Bump (never drop) every scope's id so all in-flight searches are
    // invalidated. Emptying the map instead would restart ids at 1, and a
    // pre-reset response could then match a post-reset request's id.
    for (const scope of searchRequestIdByScope.keys()) {
      nextRequestId(scope)
    }
    set({ scopes: {} })
  },
}))

export default useUserSearchStore
