import { searchUsers } from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'
import { createSessionStore } from './createSessionStore'
import { isActiveToken } from './sessionGuard'

// Search state is keyed by scope so every mounted search box reads and writes
// only its own slice: one box can never clear or reorder another box's results.
// Request tokens are per scope for the same reason; each token is unique so a
// slow, older response cannot match a newer request after clear/reset. The
// session guard is the cross-session complement: it drops a response whose
// session ended mid-flight (#391).
const searchRequestTokenByScope = new Map()

const nextRequestToken = (scope) => {
  const requestToken = Symbol(scope)
  searchRequestTokenByScope.set(scope, requestToken)
  return requestToken
}

const invalidateScope = (scope) => {
  searchRequestTokenByScope.delete(scope)
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

  search: async (scope, { query = '', page = 1 } = {}) => {
    const requestToken = nextRequestToken(scope)
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
      const response = await searchUsers({ query, page }, token)
      if (searchRequestTokenByScope.get(scope) !== requestToken) return false
      if (!isActiveToken(token)) return false
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
      return true
    } catch (error) {
      if (searchRequestTokenByScope.get(scope) !== requestToken) return false
      if (!isActiveToken(token)) return false
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
      return true
    }
  },

  // Invalidate without clearing visible results. Typing a new long-enough term
  // should keep the old list stable during the debounce window, but the old
  // request must not be allowed to commit after the term changed.
  invalidate: (scope) => {
    invalidateScope(scope)
  },

  // Clearing also invalidates any in-flight search for the scope: deleting its
  // current token turns a late response into a no-op instead of letting it
  // repopulate a box the user already emptied or unmounted. New requests get a
  // fresh Symbol, so an old response cannot match after the key is reused.
  clear: (scope) => {
    invalidateScope(scope)
    set((state) => {
      if (!(scope in state.scopes)) return state
      const scopes = { ...state.scopes }
      delete scopes[scope]
      return { scopes }
    })
  },

  reset: () => {
    // Symbols are never reused, so clearing the token map invalidates every
    // in-flight response without leaving long-lived scope keys behind.
    searchRequestTokenByScope.clear()
    set({ scopes: {} })
  },
}))

export default useUserSearchStore
