import { create } from 'zustand'
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateTwoFactor,
  setupTwoFactor,
} from '@/services/auth'
import useAuthStore from '@/stores/useAuthStore'

// Domain store for the two-factor settings feature: it owns the async
// operations (so the component never touches a service directly) and the
// feedback they produce. The transient authenticator `setup` (QR + recovery
// codes) lives here too because it must survive a re-render but not a reload.
const EMPTY_FEEDBACK = { message: '', error: '', validationDetails: [] }

const getValidationDetails = (error) =>
  Array.isArray(error?.payload?.details) ? error.payload.details : []

const useTwoFactorStore = create((set) => {
  // Every operation shares the same shape: flip submitting on, call the
  // service with the session token, then either keep the returned setup and
  // refresh the user, or surface the error's validation details.
  const run = async (serviceCall, { keepSetup = false } = {}) => {
    set({ isSubmitting: true, ...EMPTY_FEEDBACK })
    try {
      const result = await serviceCall(useAuthStore.getState().token)
      set({
        setup: keepSetup ? result.setup : null,
        message: result.message,
        isSubmitting: false,
      })
      await useAuthStore.getState().refreshUser()
    } catch (error) {
      const validationDetails = getValidationDetails(error)
      set({
        isSubmitting: false,
        validationDetails,
        error: validationDetails.length > 0 ? '' : error.message,
      })
    }
  }

  return {
    setup: null,
    message: '',
    error: '',
    validationDetails: [],
    isSubmitting: false,

    startSetup: (mode) =>
      run(mode === 'regenerate' ? regenerateTwoFactor : setupTwoFactor, {
        keepSetup: true,
      }),
    confirmSetup: (code) =>
      run((token) => confirmTwoFactorSetup({ code }, token)),
    disable: () => run(disableTwoFactor),
    clearFeedback: () => set(EMPTY_FEEDBACK),
    reset: () => set({ setup: null, isSubmitting: false, ...EMPTY_FEEDBACK }),
  }
})

export default useTwoFactorStore
