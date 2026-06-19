import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/services/auth'
import Button from '@/components/Button'
import Card from '@/components/Card'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState(() => ({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  }))
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const isTokenError = error === 'Invalid or expired token'

  const handleChange = (event) => {
    setError('')
    setValidationDetails([])
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setValidationDetails([])

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({ token: form.token, newPassword: form.newPassword })
      navigate('/login', {
        replace: true,
        state: {
          message: 'Password has been reset. Sign in with your new password.',
        },
      })
    } catch (requestError) {
      const details = Array.isArray(requestError.payload?.details)
        ? requestError.payload.details
        : []

      setValidationDetails(details)
      setError(details.length > 0 ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <div className="mb-7">
        <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
          Trackscendence
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Reset password</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Reset token">
          <Input
            name="token"
            type="text"
            autoComplete="one-time-code"
            value={form.token}
            onChange={handleChange}
            required
          />
        </FormField>

        <FormField
          label="New password"
          hint="Use 8+ characters with upper/lowercase letters, a number, and a symbol."
        >
          <Input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            required
          />
        </FormField>

        <FormField label="Confirm new password">
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </FormField>

        {validationDetails.length > 0 ? (
          <div className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
            {validationDetails.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
            <p>
              {isTokenError
                ? 'This reset link is invalid, expired, or has already been used. Request a new password reset email and try again.'
                : error}
            </p>
            {isTokenError ? (
              <p className="mt-2">
                <Link
                  className="font-semibold text-[#8a321f] underline hover:text-[#702817]"
                  to="/forgot-password"
                >
                  Request a new reset link
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting password' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[#50635a]">
        Remembered your password?{' '}
        <Link
          className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
          to="/login"
        >
          Log in
        </Link>
      </p>
    </Card>
  )
}

export default ResetPassword
