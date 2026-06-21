import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import Card from '@/components/Card'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const Signup = () => {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '' })
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
      await register(form)
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in to continue.' },
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
        <h1 className="mt-2 text-2xl font-semibold">Create your account</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account' : 'Sign up'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[#50635a]">
        Already registered?{' '}
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

export default Signup
