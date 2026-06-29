import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '@/services/auth'
import Button from '@/components/Button'
import Panel from '@/components/Panel'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setValidationDetails([])
    setMessage('')
    setIsSubmitting(true)

    try {
      const result = await requestPasswordReset({ email })
      setMessage(result.message)
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
    <Panel>
      <div className="mb-7">
        <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
          Trackscendence
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Forgot password</h1>
      </div>

      {message ? (
        <p className="mb-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
          {message}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Email">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setError('')
              setValidationDetails([])
              setEmail(event.target.value)
            }}
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
          {isSubmitting ? 'Sending request' : 'Send reset instructions'}
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
    </Panel>
  )
}

export default ForgotPassword
