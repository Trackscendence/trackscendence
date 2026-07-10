import {
  deleteAccount as deleteAccountRequest,
  exportAccountData as exportAccountDataRequest,
} from '@/services/users'
import { getStoredToken } from '@/services/auth'
import { createSessionStore } from './createSessionStore'
import useAuthStore from './useAuthStore'

const getActiveToken = () => {
  return useAuthStore.getState().token || getStoredToken()
}

const getDefaultState = () => ({
  error: '',
  isDeleting: false,
  isExporting: false,
})

// Session store (#391): holds only per-session flags today, but registering it
// keeps the "every user-scoped store resets at teardown" invariant complete.
const useAccountDataStore = createSessionStore((set, get) => ({
  ...getDefaultState(),

  clearError: () => set({ error: '' }),

  exportAccountData: async () => {
    if (get().isExporting) return null

    const token = getActiveToken()

    if (!token) {
      set({ error: 'Authentication required' })
      return null
    }

    set({ error: '', isExporting: true })

    try {
      const data = await exportAccountDataRequest(token)
      set({ isExporting: false })
      return data
    } catch (error) {
      set({ error: error.message, isExporting: false })
      return null
    }
  },

  deleteAccount: async (confirmation) => {
    if (get().isDeleting) return null

    const token = getActiveToken()

    if (!token) {
      set({ error: 'Authentication required' })
      return null
    }

    set({ error: '', isDeleting: true })

    try {
      const result = await deleteAccountRequest({ confirmation }, token)
      useAuthStore.getState().clearSession()
      set({ isDeleting: false })
      return result
    } catch (error) {
      set({ error: error.message, isDeleting: false })
      return null
    }
  },

  reset: () => set(getDefaultState()),
}))

export default useAccountDataStore
