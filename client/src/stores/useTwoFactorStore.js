import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateTwoFactor,
  setupTwoFactor,
} from '@/services/auth'
import { createSessionStore } from './createSessionStore'
import { isActiveToken } from './sessionGuard'
import useAuthStore from '@/stores/useAuthStore'

// Domain store for the two-factor settings feature: it owns the async
// operations (so the component never touches a service directly) and the
// feedback they produce. The transient authenticator `setup` (QR + recovery
// codes) lives here too because it must survive a re-render but not a reload.
const EMPTY_FEEDBACK = { message: '', error: '', validationDetails: [] }

const getValidationDetails = (error) =>
  Array.isArray(error?.payload?.details) ? error.payload.details : []

// Session store (#391): `setup` holds the authenticator secret and recovery
// codes, so the store resets at teardown and guards its post-await writes.
const useTwoFactorStore = createSessionStore((set) => {
  // Every operation shares the same shape: flip submitting on, call the
  // service with the session token, then either keep the returned setup and
  // refresh the user, or surface the error's validation details.
  const run = async (serviceCall, { keepSetup = false } = {}) => {
    const token = useAuthStore.getState().token
    set({ isSubmitting: true, ...EMPTY_FEEDBACK })
    try {
      const result = await serviceCall(token)
      if (!isActiveToken(token)) return
      set({
        setup: keepSetup ? result.setup : null,
        message: result.message,
        isSubmitting: false,
      })
      await useAuthStore.getState().refreshUser()
    } catch (error) {
      if (!isActiveToken(token)) return
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
