import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const SignupForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
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
    setIsSubmitting(true)

    try {
      await useAuthStore.getState().register(form)
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
      <FormField label="Username">
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

      <Button type="submit" variant="blue" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account' : 'Create account'}
      </Button>
    </form>
  )
}

export default SignupForm
