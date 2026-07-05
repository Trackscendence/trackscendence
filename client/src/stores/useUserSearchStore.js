import { create } from 'zustand'
import { searchUsers } from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'

// Monotonic id for searches so a slow, older request cannot overwrite the
// result of a newer one.
let searchRequestId = 0

const useUserSearchStore = create((set) => ({
  results: [],
  pagination: null,
  isSearching: false,
  error: null,
  // Distinguishes "no matches" from "nothing searched yet" so the UI only
  // shows an empty state after a real search.
  hasSearched: false,

  search: async ({ q = '', page = 1 } = {}) => {
    const requestId = ++searchRequestId
    const token = useAuthStore.getState().token
    set({ isSearching: true, error: null })
    try {
      const response = await searchUsers({ q, page }, token)
      if (requestId !== searchRequestId) return
      set({
        results: response?.users ?? [],
        pagination: response?.pagination ?? null,
        isSearching: false,
        hasSearched: true,
      })
    } catch (error) {
      if (requestId !== searchRequestId) return
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
}))

export default useUserSearchStore
