import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import { normalizeSignupInput } from '@/services/auth.normalizations'
import { validateSignupInput } from '@/services/auth.validations'

const GuestUpgradeForm = ({ initialUsername }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: initialUsername || '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [validationDetails, setValidationDetails] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const notify = (message, type) =>
    useNotificationStore.getState().push(message, type)

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

    const normalizedForm = {
      ...normalizeSignupInput(form),
      privacyAccepted,
      termsAccepted,
    }
    const { isValid, errors } = validateSignupInput(normalizedForm)
    const details = Object.values(errors)

    if (!termsAccepted) {
      details.push('Terms of Service acceptance is required')
    }

    if (!privacyAccepted) {
      details.push('Privacy Policy acceptance is required')
    }

    if (!isValid || details.length > 0) {
      setValidationDetails(details)
      return
    }

    setIsSubmitting(true)

    try {
      await useAuthStore.getState().upgradeGuestAccount(normalizedForm)
      notify('Account saved', 'success')
    } catch (requestError) {
      const requestDetails = Array.isArray(requestError.payload?.details)
        ? requestError.payload.details
        : []

      setValidationDetails(requestDetails)
      setError(requestDetails.length > 0 ? '' : requestError.message)
      notify(requestError.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm leading-6 text-[#6f5439]">
        Add email and password login to keep this profile after you leave.
      </p>

      <FormField
        label="Username"
        hint="Lowercase letters and numbers only, starting with a letter."
      >
        <Input
          name="username"
          type="text"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField
        label="Password"
        hint="Use 8+ characters with upper/lowercase letters, a number, and a symbol."
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={handleChange}
          required
        />
      </FormField>

      <label className="flex items-start gap-2 text-sm text-[#3d1200]">
        <input
          className="mt-1"
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
        />
        <span>
          I agree to the{' '}
          <Link
            className="font-semibold text-[#2f6f86] underline"
            to="/terms-of-service"
          >
            Terms of Service
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm text-[#3d1200]">
        <input
          className="mt-1"
          type="checkbox"
          checked={privacyAccepted}
          onChange={(event) => setPrivacyAccepted(event.target.checked)}
        />
        <span>
          I agree to the{' '}
          <Link
            className="font-semibold text-[#2f6f86] underline"
            to="/privacy-policy"
          >
            Privacy Policy
          </Link>
        </span>
      </label>

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

      <div className="flex justify-end">
        <Button
          fullWidth={false}
          type="submit"
          variant="orange"
          disabled={isSubmitting || !termsAccepted || !privacyAccepted}
        >
          {isSubmitting ? 'Saving account' : 'Save progress'}
        </Button>
      </div>
    </form>
  )
}

export default GuestUpgradeForm
