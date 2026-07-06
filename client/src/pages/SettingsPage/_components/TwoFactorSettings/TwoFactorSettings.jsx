import { useEffect, useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useTwoFactorStore from '@/stores/useTwoFactorStore'
import TwoFactorStatus from './_components/TwoFactorStatus'
import TwoFactorSetup from './_components/TwoFactorSetup'

// Container for the two-factor feature: reads the session user and the
// two-factor store, owns only the transient code field, and hands data plus
// actions to the two presenters. All async work lives in the store, so nothing
// here calls a service directly.
const getState = (user) => {
  if (user.twoFactorEnabled) return 'enabled'
  if (user.twoFactorSetupPending) return 'pending'
  return 'disabled'
}

const TwoFactorSettings = () => {
  const user = useAuthStore((state) => state.user)
  const setup = useTwoFactorStore((state) => state.setup)
  const message = useTwoFactorStore((state) => state.message)
  const error = useTwoFactorStore((state) => state.error)
  const validationDetails = useTwoFactorStore(
    (state) => state.validationDetails,
  )
  const isSubmitting = useTwoFactorStore((state) => state.isSubmitting)
  const [code, setCode] = useState('')

  // Leaving the page drops any in-flight setup and feedback so a later visit
  // starts clean.
  useEffect(() => useTwoFactorStore.getState().reset, [])

  if (!user) return null

  const state = getState(user)
  const visibleSetup = user.twoFactorSetupPending ? setup : null

  const handleStartSetup = () => {
    setCode('')
    useTwoFactorStore
      .getState()
      .startSetup(state === 'disabled' ? 'setup' : 'regenerate')
  }

  const handleDisable = () => {
    if (
      window.confirm(
        'Disable two-factor authentication for this account? Existing recovery codes will stop working.',
      )
    ) {
      useTwoFactorStore.getState().disable()
    }
  }

  const handleConfirm = (event) => {
    event.preventDefault()
    useTwoFactorStore.getState().confirmSetup(code)
  }

  const handleCodeChange = (event) => {
    useTwoFactorStore.getState().clearFeedback()
    setCode(event.target.value)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TwoFactorStatus
        state={state}
        isSubmitting={isSubmitting}
        message={message}
        error={error}
        validationDetails={validationDetails}
        showPendingHint={user.twoFactorSetupPending && !visibleSetup}
        onStartSetup={handleStartSetup}
        onDisable={handleDisable}
      />
      <TwoFactorSetup
        setup={visibleSetup}
        code={code}
        isSubmitting={isSubmitting}
        onCodeChange={handleCodeChange}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export default TwoFactorSettings
