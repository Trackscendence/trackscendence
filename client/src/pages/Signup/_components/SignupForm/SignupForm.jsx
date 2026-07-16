import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import { validateSignupInput } from '@/services/auth.validations'
import { normalizeSignupInput } from '@/services/auth.normalizations'
import Modal from '@/components/Modal'
import TermsOfService from '@/pages/TermsOfService/TermsOfService'
import Privacy from '@/pages/Privacy/Privacy'
import { validatePasswordConfirmation } from './_utils/passwordConfirmation'

const SignupForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [showPrivacy, setShowPrivacy] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

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

    if (!isValid) {
      setValidationDetails(Object.values(errors))
      return
    }

    const passwordConfirmationError = validatePasswordConfirmation(form)

    if (passwordConfirmationError) {
      setValidationDetails([passwordConfirmationError])
      return
    }

    setIsSubmitting(true)

    try {
      await useAuthStore.getState().register(normalizedForm)
      onSuccess()
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
    <form className="space-y-4" onSubmit={handleSubmit}>
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

      <FormField label="Confirm password">
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
      </FormField>

      <div className="space-y-2">
        <button
          type="button"
          className="text-sm font-medium text-[#2f6f86] underline"
          onClick={() => setShowTerms(true)}
        >
          Terms of Service
        </button>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>I agree to the Terms of Service</span>
        </label>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="text-sm font-medium text-[#2f6f86] underline"
          onClick={() => setShowPrivacy(true)}
        >
          Privacy Policy
        </button>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
          />
          <span>I agree to the Privacy Policy</span>
        </label>
      </div>

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

      <Button
        type="submit"
        variant="blue"
        disabled={isSubmitting || !termsAccepted || !privacyAccepted}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <Modal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
      >
        <div className="space-y-4 text-sm leading-6">
          <TermsOfService />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="blue"
            onClick={() => setShowTerms(false)}
          >
            Close
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
      >
        <div className="space-y-4 text-sm leading-6">
          <Privacy />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="blue"
            onClick={() => setShowPrivacy(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </form>
  )
}

export default SignupForm
