import { useEffect, useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useTwoFactorStore from '@/stores/useTwoFactorStore'
import ConfirmDialog from '@/components/ConfirmDialog'
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
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  // Leaving the page drops any in-flight setup and feedback so a later visit
  // starts clean.
  useEffect(() => useTwoFactorStore.getState().reset, [])

  if (!user) return null

  const state = getState(user)
  const visibleSetup = user.twoFactorSetupPending ? setup : null

  const runSetup = (mode) => {
    setCode('')
    useTwoFactorStore.getState().startSetup(mode)
  }

  // Starting from disabled or restarting a pending setup has nothing active to
  // lose, so it runs straight away. Regenerating while enabled will replace the
  // working authenticator once the new codes are confirmed — worth a heads-up.
  const handleStartSetup = () => {
    if (state === 'enabled') {
      setShowRegenerateConfirm(true)
      return
    }
    runSetup(state === 'disabled' ? 'setup' : 'regenerate')
  }

  const handleConfirmRegenerate = async () => {
    setCode('')
    try {
      await useTwoFactorStore.getState().startSetup('regenerate')
    } finally {
      setShowRegenerateConfirm(false)
    }
  }

  const handleConfirmDisable = async () => {
    try {
      await useTwoFactorStore.getState().disable()
    } finally {
      setShowDisableConfirm(false)
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
        onDisable={() => setShowDisableConfirm(true)}
      />
      <TwoFactorSetup
        setup={visibleSetup}
        code={code}
        isSubmitting={isSubmitting}
        onCodeChange={handleCodeChange}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        isOpen={showDisableConfirm}
        tone="danger"
        title="Disable two-factor authentication?"
        description="Two-factor stays off until you set it up again. Your recovery codes stop working right away, and you'll sign in with just your password."
        confirmLabel="Disable 2FA"
        confirmingLabel="Disabling…"
        isConfirming={isSubmitting}
        onConfirm={handleConfirmDisable}
        onCancel={() => setShowDisableConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        tone="primary"
        title="Regenerate two-factor setup?"
        description="This creates a new QR code and recovery codes. Your current authenticator keeps working until you scan the new code and confirm — then your old recovery codes are replaced."
        confirmLabel="Regenerate"
        confirmingLabel="Starting…"
        isConfirming={isSubmitting}
        onConfirm={handleConfirmRegenerate}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </div>
  )
}

export default TwoFactorSettings
