import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/services/auth'
import usePasswordOperation from '@/hooks/usePasswordOperation'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const ResetPasswordForm = ({ onSuccess }) => {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState(() => ({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  }))
  const { submit, reset, fail, error, validationDetails, isSubmitting } =
    usePasswordOperation(resetPassword)
  const isTokenError = error === 'Invalid or expired token'

  const handleChange = (event) => {
    reset()
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      fail('Passwords do not match')
      return
    }

    const { ok } = await submit({
      token: form.token,
      newPassword: form.newPassword,
    })
    if (ok) onSuccess()
  }

  return (
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

      <Button type="submit" variant="blue" disabled={isSubmitting}>
        {isSubmitting ? 'Resetting password' : 'Reset password'}
      </Button>
    </form>
  )
}

export default ResetPasswordForm
