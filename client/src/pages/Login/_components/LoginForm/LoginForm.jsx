import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import { validateLoginInput } from '@/services/auth.validations'

const LoginForm = ({ onSuccess }) => {
  const { login, completeTwoFactorLogin } = useAuthStore()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [twoFactorForm, setTwoFactorForm] = useState({
    code: '',
    recoveryCode: '',
  })
  const [twoFactorState, setTwoFactorState] = useState(null)
  const [twoFactorMethod, setTwoFactorMethod] = useState('totp')
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    setError('')
    setValidationDetails({})
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
    setValidationDetails({})

    const validations = validateLoginInput(form)

    if (!validations.isValid) {
      setValidationDetails(validations.errors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login(validations.normalizedData)

      if (result.requiresTwoFactor) {
        setTwoFactorState(result)
        setTwoFactorMethod('totp')
        setTwoFactorForm({ code: '', recoveryCode: '' })
        return
      }

      onSuccess()
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
      onSuccess()
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
    setTwoFactorForm({ code: '', recoveryCode: '' })
  }

  const isTwoFactorStep = Boolean(twoFactorState)

  if (isTwoFactorStep) {
    return (
      <>
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

        <form className="space-y-4" onSubmit={handleTwoFactorSubmit}>
          <div>
            <p className="text-sm font-medium text-[#081934]">
              Choose verification method
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={twoFactorMethod === 'totp' ? 'blue' : 'social'}
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
                  twoFactorMethod === 'recovery_code' ? 'blue' : 'social'
                }
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

          {error ? (
            <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="blue" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying code' : 'Verify and continue'}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#0196FF] hover:text-[#0080e0]"
          onClick={resetTwoFactorStep}
        >
          Back to password step
        </button>
      </>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Email or username">
        <Input
          name="identifier"
          type="text"
          autoComplete="username"
          value={form.identifier}
          onChange={handleChange}
          required
        />
        {validationDetails.identifier ? (
          <p className="mt-1 text-sm text-[#8a321f]">
            {validationDetails.identifier}
          </p>
        ) : null}
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
        {validationDetails.password ? (
          <p className="mt-1 text-sm text-[#8a321f]">
            {validationDetails.password}
          </p>
        ) : null}
      </FormField>

      {error ? (
        <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="blue" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in' : 'Log in'}
      </Button>
    </form>
  )
}

export default LoginForm
