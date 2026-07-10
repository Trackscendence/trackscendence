import {
  deleteAccount as deleteAccountRequest,
  exportAccountData as exportAccountDataRequest,
} from '@/services/users'
import { getStoredToken } from '@/services/auth'
import { createSessionStore } from './createSessionStore'
import { isActiveToken } from './sessionGuard'
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
      // The caller downloads whatever this returns, so a response from a
      // session that ended or changed mid-flight must not reach the next user.
      if (!isActiveToken(token)) return null
      set({ isExporting: false })
      return data
    } catch (error) {
      if (!isActiveToken(token)) return null
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
      if (!isActiveToken(token)) {
        // The session already moved on; still clear it for this delete, but
        // write nothing into a store the next session owns.
        useAuthStore.getState().clearSession()
        return null
      }
      // clearSession triggers the session teardown, which resets this store;
      // no flag write afterwards, the reset already returned it to defaults.
      useAuthStore.getState().clearSession()
      return result
    } catch (error) {
      if (!isActiveToken(token)) return null
      set({ error: error.message, isDeleting: false })
      return null
    }
  },

  reset: () => set(getDefaultState()),
}))

export default useAccountDataStore
