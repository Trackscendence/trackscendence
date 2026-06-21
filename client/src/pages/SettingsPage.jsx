import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateTwoFactor,
  setupTwoFactor,
} from '@/services/auth'

const getValidationDetails = (requestError) => {
  return Array.isArray(requestError.payload?.details)
    ? requestError.payload.details
    : []
}

const SettingsPage = () => {
  const navigate = useNavigate()
  const { refreshUser, token, user } = useAuthStore()
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center justify-center py-10 text-sm font-medium text-[#27352f]">
        Loading account
      </div>
    )
  }

  const clearFeedback = () => {
    setError('')
    setMessage('')
    setValidationDetails([])
  }

  const visibleSetup = user.twoFactorSetupPending ? setup : null

  const handleSetupRequest = async (mode) => {
    clearFeedback()
    setIsSubmitting(true)

    try {
      const result =
        mode === 'regenerate'
          ? await regenerateTwoFactor(token)
          : await setupTwoFactor(token)
      setSetup(result.setup)
      setCode('')
      setMessage(result.message)
      await refreshUser()
    } catch (requestError) {
      const details = getValidationDetails(requestError)

      setValidationDetails(details)
      setError(details.length > 0 ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmSetup = async (event) => {
    event.preventDefault()
    clearFeedback()
    setIsSubmitting(true)

    try {
      const result = await confirmTwoFactorSetup({ code }, token)
      setSetup(null)
      setCode('')
      setMessage(result.message)
      await refreshUser()
    } catch (requestError) {
      const details = getValidationDetails(requestError)

      setValidationDetails(details)
      setError(details.length > 0 ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDisable = async () => {
    if (
      !window.confirm(
        'Disable two-factor authentication for this account? Existing recovery codes will stop working.',
      )
    ) {
      return
    }

    clearFeedback()
    setIsSubmitting(true)

    try {
      const result = await disableTwoFactor(token)
      setSetup(null)
      setCode('')
      setMessage(result.message)
      await refreshUser()
    } catch (requestError) {
      const details = getValidationDetails(requestError)

      setValidationDetails(details)
      setError(details.length > 0 ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
          Trackscendence
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#50635a]">
              Manage account security, password access, and two-factor
              authentication from one place.
            </p>
          </div>
          <button
            className="rounded-md border border-[#cbd5c5] px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
            type="button"
            onClick={() => navigate('/')}
          >
            Back to session
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <div className="min-w-0 rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                <p className="text-sm font-medium text-[#617267]">Username</p>
                <p className="mt-1 text-base font-semibold">{user.username}</p>
              </div>
              <div className="min-w-0 rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                <p className="text-sm font-medium text-[#617267]">Email</p>
                <p className="mt-1 text-sm font-semibold break-all sm:text-base">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Password</h2>
            <p className="mt-2 text-sm text-[#50635a]">
              Rotate your password if you think it has been exposed or if you
              simply want to strengthen access to this account.
            </p>
            <button
              className="mt-5 rounded-md border border-[#cbd5c5] px-4 py-2.5 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
              type="button"
              onClick={() => navigate('/change-password')}
            >
              Change password
            </button>
          </div>

          <div className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Two-factor status</h2>
                <p className="mt-2 text-sm text-[#50635a]">
                  {user.twoFactorEnabled
                    ? 'Two-factor authentication is currently enabled for your account.'
                    : user.twoFactorSetupPending
                      ? 'A setup is pending confirmation. Scan the current setup and verify one code to finish.'
                      : 'Two-factor authentication is currently disabled.'}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  user.twoFactorEnabled
                    ? 'bg-[#eef7f1] text-[#24563f]'
                    : user.twoFactorSetupPending
                      ? 'bg-[#fff6df] text-[#916b12]'
                      : 'bg-[#f1f3f0] text-[#617267]'
                }`}
              >
                {user.twoFactorEnabled
                  ? 'Enabled'
                  : user.twoFactorSetupPending
                    ? 'Pending'
                    : 'Disabled'}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  handleSetupRequest(
                    user.twoFactorEnabled || user.twoFactorSetupPending
                      ? 'regenerate'
                      : 'setup',
                  )
                }
              >
                {user.twoFactorEnabled
                  ? 'Regenerate 2FA setup'
                  : user.twoFactorSetupPending
                    ? 'Restart setup'
                    : 'Start setup'}
              </button>

              {(user.twoFactorEnabled || user.twoFactorSetupPending) && (
                <button
                  className="rounded-md border border-[#cbd5c5] px-4 py-2.5 text-sm font-semibold text-[#27352f] transition hover:border-[#b6523b] hover:text-[#b6523b] disabled:cursor-not-allowed disabled:border-[#d7dfd4] disabled:text-[#91a69b]"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDisable}
                >
                  Disable 2FA
                </button>
              )}
            </div>

            <p className="mt-4 text-sm text-[#50635a]">
              Recovery codes are backup second-factor codes. If you lose access
              to your authenticator app, you can still use one of them after
              entering your password.
            </p>

            {message ? (
              <p className="mt-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
                {message}
              </p>
            ) : null}

            {validationDetails.length > 0 ? (
              <div className="mt-4 rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
                {validationDetails.map((detail) => (
                  <p key={detail}>{detail}</p>
                ))}
              </div>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
                {error}
              </p>
            ) : null}

            {user.twoFactorSetupPending && !visibleSetup ? (
              <div className="mt-6 rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4 text-sm text-[#50635a]">
                A setup is pending, but the QR code and recovery codes were only
                shown when that setup started. If you need them again, use{' '}
                <strong>Restart setup</strong> to generate a fresh secret and a
                new set of recovery codes.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Authenticator setup</h2>
          {visibleSetup ? (
            <div className="mt-4 space-y-5">
              <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                <p className="text-sm font-medium text-[#617267]">
                  Scan this QR code with your authenticator app
                </p>
                <img
                  className="mt-4 w-full rounded-md border border-[#d8dfd4] bg-white p-3"
                  src={visibleSetup.qrCodeDataUrl}
                  alt="Two-factor setup QR code"
                />
              </div>

              <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                <p className="text-sm font-medium text-[#617267]">Manual key</p>
                <p className="mt-2 font-mono text-sm break-all text-[#27352f]">
                  {visibleSetup.manualEntryKey}
                </p>
                <p className="mt-2 text-xs text-[#617267]">
                  Use this if you prefer to type the secret into your app.
                </p>
              </div>

              <div className="rounded-md border border-[#f0d8a2] bg-[#fff9ea] p-4">
                <p className="text-sm font-semibold text-[#7d5a12]">
                  Save these recovery codes now
                </p>
                <p className="mt-2 text-sm text-[#7d5a12]">
                  Each code works once. They will not be shown again after you
                  leave this page or restart setup.
                </p>
                <p className="mt-2 text-sm text-[#7d5a12]">
                  Use them only as a backup when you cannot access your
                  authenticator app.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {visibleSetup.recoveryCodes.map((recoveryCode) => (
                    <code
                      className="rounded-md border border-[#f0d8a2] bg-white px-3 py-2 text-sm font-semibold tracking-[0.15em] text-[#6c4d10]"
                      key={recoveryCode}
                    >
                      {recoveryCode}
                    </code>
                  ))}
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleConfirmSetup}>
                <label className="block">
                  <span className="text-sm font-medium">
                    Enter one authenticator code to confirm setup
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base tracking-[0.35em] transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                    name="code"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    value={code}
                    onChange={(event) => {
                      clearFeedback()
                      setCode(event.target.value)
                    }}
                    required
                  />
                </label>

                <button
                  className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Confirming setup' : 'Confirm and enable 2FA'}
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-[#cfd8ca] bg-[#fbfcfa] p-5 text-sm text-[#50635a]">
              Start setup to generate a QR code, a manual entry key, and a new
              set of recovery codes for your account. Everything related to
              two-factor authentication now lives on this settings page.
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default SettingsPage
