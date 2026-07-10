import { searchUsers } from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'
import { createSessionStore } from './createSessionStore'
import { isActiveToken } from './sessionGuard'

// Monotonic id for searches so a slow, older request cannot overwrite the
// result of a newer one. The session guard below is the cross-session
// complement: it drops a response whose session ended mid-flight (#391).
let searchRequestId = 0

const getDefaultState = () => ({
  results: [],
  pagination: null,
  isSearching: false,
  error: null,
  // Distinguishes "no matches" from "nothing searched yet" so the UI only
  // shows an empty state after a real search.
  hasSearched: false,
})

// Session store (#391): holds the previous user's search query results, so it
// is cleared by resetSessionStores() at teardown.
const useUserSearchStore = createSessionStore((set) => ({
  ...getDefaultState(),

  search: async ({ q = '', page = 1 } = {}) => {
    const requestId = ++searchRequestId
    const token = useAuthStore.getState().token
    set({ isSearching: true, error: null })
    try {
      const response = await searchUsers({ q, page }, token)
      if (requestId !== searchRequestId) return
      if (!isActiveToken(token)) return
      set({
        results: response?.users ?? [],
        pagination: response?.pagination ?? null,
        isSearching: false,
        hasSearched: true,
      })
    } catch (error) {
      if (requestId !== searchRequestId) return
      if (!isActiveToken(token)) return
      set({
        isSearching: false,
        error: error?.message || 'Search failed',
        hasSearched: true,
      })
    }
  },

  clear: () =>
    set({
      results: [],
      pagination: null,
      error: null,
      hasSearched: false,
    }),

  reset: () => set(getDefaultState()),
}))

export default useUserSearchStore
