import { create } from 'zustand'
import { searchUsers } from '@/services/users'
import useAuthStore from '@/stores/useAuthStore'

const useUserSearchStore = create((set) => ({
  results: [],
  pagination: null,
  isSearching: false,
  error: null,
  // Distinguishes "no matches" from "nothing searched yet" so the UI only
  // shows an empty state after a real search.
  hasSearched: false,

  search: async ({ q, page = 1 }) => {
    const token = useAuthStore.getState().token
    set({ isSearching: true, error: null })
    try {
      const response = await searchUsers({ q, page }, token)
      set({
        results: response?.users ?? [],
        pagination: response?.pagination ?? null,
        isSearching: false,
        hasSearched: true,
      })
    } catch (error) {
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
