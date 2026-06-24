import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import Card from '@/components/Card'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeTwoFactorLogin, isAuthenticated, isLoading, login } =
    useAuthStore()
  const [form, setForm] = useState({ identifier: '', password: '' })
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
    return <LoadingSpinner message="Loading session" />
  }

  if (isAuthenticated && !isSubmitting) {
    return <Navigate to={from} replace />
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleTwoFactorChange = (event) => {
    setTwoFactorForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
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
    <Card>
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
            Finish signing in for <strong>{form.identifier}</strong> using your
            authenticator app or a recovery code.
          </p>
          <p className="mt-2 text-[#50635a]">
            Forgot your authenticator? You can use a recovery code after
            entering your password.
          </p>
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={isTwoFactorStep ? handleTwoFactorSubmit : handleSubmit}
      >
        {isTwoFactorStep ? (
          <>
            <div>
              <p className="text-sm font-medium">Choose verification method</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={twoFactorMethod === 'totp' ? 'primary' : 'outline'}
                  className="px-3 py-2"
                  onClick={() => {
                    setError('')
                    setTwoFactorMethod('totp')
                  }}
                >
                  Authenticator code
                </Button>
                <Button
                  type="button"
                  variant={
                    twoFactorMethod === 'recovery_code' ? 'primary' : 'outline'
                  }
                  className="px-3 py-2"
                  onClick={() => {
                    setError('')
                    setTwoFactorMethod('recovery_code')
                  }}
                >
                  Recovery code
                </Button>
              </div>
            </div>

            {twoFactorMethod === 'recovery_code' ? (
              <FormField label="Recovery code">
                <Input
                  className="tracking-[0.18em] uppercase"
                  name="recoveryCode"
                  type="text"
                  autoComplete="one-time-code"
                  value={twoFactorForm.recoveryCode}
                  onChange={handleTwoFactorChange}
                  required
                />
              </FormField>
            ) : (
              <FormField label="Authenticator code">
                <Input
                  className="tracking-[0.35em]"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  value={twoFactorForm.code}
                  onChange={handleTwoFactorChange}
                  required
                />
              </FormField>
            )}
          </>
        ) : (
          <>
            <FormField label="Email or username">
              <Input
                name="identifier"
                type="text"
                autoComplete="username"
                value={form.identifier}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Password">
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </FormField>
          </>
        )}

        {error ? (
          <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isTwoFactorStep
              ? 'Verifying code'
              : 'Logging in'
            : isTwoFactorStep
              ? 'Verify and continue'
              : 'Log in'}
        </Button>
      </form>

      {isTwoFactorStep ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={resetTwoFactorStep}
        >
          Back to password step
        </Button>
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
    </Card>
  )
}

export default Login
