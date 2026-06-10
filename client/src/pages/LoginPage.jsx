import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeTwoFactorLogin, isAuthenticated, isLoading, login } =
    useAuth()
  const [form, setForm] = useState({
    identifier: '',
    password: '',
  })
  const [twoFactorForm, setTwoFactorForm] = useState({
    code: '',
    recoveryCode: '',
  })
  const [twoFactorState, setTwoFactorState] = useState(null)
  const [twoFactorMethod, setTwoFactorMethod] = useState('totp')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const from = location.state?.from?.pathname || '/'
  const params = new URLSearchParams(location.search)
  const passwordChanged = params.get('passwordChanged') === '1'
  const message =
    location.state?.message ||
    (passwordChanged
      ? 'Password updated successfully. Please log in again.'
      : '')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f2] text-sm font-medium text-[#27352f]">
        Loading session
      </div>
    )
  }

  if (isAuthenticated && !isSubmitting) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleTwoFactorChange = (event) => {
    setTwoFactorForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(form)

      if (result.requiresTwoFactor) {
        setTwoFactorState(result)
        setTwoFactorMethod('totp')
        setTwoFactorForm({
          code: '',
          recoveryCode: '',
        })
        return
      }

      navigate(from, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTwoFactorSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await completeTwoFactorLogin({
        challengeToken: twoFactorState.challengeToken,
        ...(twoFactorMethod === 'recovery_code'
          ? { recoveryCode: twoFactorForm.recoveryCode }
          : { code: twoFactorForm.code }),
      })
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetTwoFactorStep = () => {
    setError('')
    setTwoFactorState(null)
    setTwoFactorMethod('totp')
    setTwoFactorForm({
      code: '',
      recoveryCode: '',
    })
  }

  const isTwoFactorStep = Boolean(twoFactorState)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
      <section className="w-full max-w-md rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <div className="mb-7">
          <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
            Trackscendence
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {isTwoFactorStep ? 'Two-factor verification' : 'Log in'}
          </h1>
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
            {message}
          </p>
        ) : null}

        {isTwoFactorStep ? (
          <div className="mb-4 rounded-md border border-[#dce5d6] bg-[#f8fbf7] px-3 py-2 text-sm text-[#3f5248]">
            <p>
              Finish signing in for <strong>{form.identifier}</strong> using
              your authenticator app or a recovery code.
            </p>
            <p className="mt-2 text-[#50635a]">
              Forgot your authenticator? You can use a recovery code after
              entering your password.
            </p>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={
            isTwoFactorStep ? handleTwoFactorSubmit : handleCredentialsSubmit
          }
        >
          {isTwoFactorStep ? (
            <>
              <div>
                <p className="text-sm font-medium">
                  Choose verification method
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      twoFactorMethod === 'totp'
                        ? 'border-[#2f7d61] bg-[#eef7f1] text-[#24563f]'
                        : 'border-[#cbd5c5] text-[#50635a] hover:border-[#2f7d61] hover:text-[#2f7d61]'
                    }`}
                    type="button"
                    onClick={() => {
                      setError('')
                      setTwoFactorMethod('totp')
                    }}
                  >
                    Authenticator code
                  </button>
                  <button
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      twoFactorMethod === 'recovery_code'
                        ? 'border-[#2f7d61] bg-[#eef7f1] text-[#24563f]'
                        : 'border-[#cbd5c5] text-[#50635a] hover:border-[#2f7d61] hover:text-[#2f7d61]'
                    }`}
                    type="button"
                    onClick={() => {
                      setError('')
                      setTwoFactorMethod('recovery_code')
                    }}
                  >
                    Recovery code
                  </button>
                </div>
              </div>

              {twoFactorMethod === 'recovery_code' ? (
                <label className="block">
                  <span className="text-sm font-medium">Recovery code</span>
                  <input
                    className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base tracking-[0.18em] uppercase transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                    name="recoveryCode"
                    type="text"
                    autoComplete="one-time-code"
                    value={twoFactorForm.recoveryCode}
                    onChange={handleTwoFactorChange}
                    required
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="text-sm font-medium">
                    Authenticator code
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base tracking-[0.35em] transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                    name="code"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    value={twoFactorForm.code}
                    onChange={handleTwoFactorChange}
                    required
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium">Email or username</span>
                <input
                  className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={form.identifier}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Password</span>
                <input
                  className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </label>
            </>
          )}

          {error ? (
            <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isTwoFactorStep
                ? 'Verifying code'
                : 'Logging in'
              : isTwoFactorStep
                ? 'Verify and continue'
                : 'Log in'}
          </button>
        </form>

        {isTwoFactorStep ? (
          <button
            className="mt-5 w-full rounded-md border border-[#cbd5c5] bg-transparent px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
            type="button"
            onClick={resetTwoFactorStep}
          >
            Back to password step
          </button>
        ) : (
          <>
            <p className="mt-5 text-center text-sm text-[#50635a]">
              New player?{' '}
              <Link
                className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
                to="/signup"
              >
                Create an account
              </Link>
            </p>
            <p className="mt-3 text-center text-sm text-[#50635a]">
              <Link
                className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
                to="/forgot-password"
              >
                Forgot your password?
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export default LoginPage
