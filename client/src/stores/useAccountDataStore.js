import { create } from 'zustand'
import {
  deleteAccount as deleteAccountRequest,
  exportAccountData as exportAccountDataRequest,
} from '@/services/users'
import { getStoredToken } from '@/services/auth'
import useAuthStore from './useAuthStore'

const getActiveToken = () => {
  return useAuthStore.getState().token || getStoredToken()
}

const useAccountDataStore = create((set, get) => ({
  error: '',
  isDeleting: false,
  isExporting: false,

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
}))

export default useAccountDataStore
