import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { AUTH_TOKEN_KEY, changePassword } from '@/services/auth'
import Button from '@/components/Button'
import Panel from '@/components/Panel'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const ChangePassword = () => {
  const { token } = useAuthStore()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await changePassword(
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        token,
      )
      localStorage.removeItem(AUTH_TOKEN_KEY)
      window.location.replace('/login?passwordChanged=1')
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
    <div className="flex justify-center">
      <Panel>
        <div className="mb-7">
          <h1 className="text-2xl font-semibold">Change password</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Current password">
            <Input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
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
            <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating password' : 'Change password'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#50635a]">
          <Link
            className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
            to="/"
          >
            Back to home
          </Link>
        </p>
      </Panel>
    </div>
  )
}

export default ChangePassword
