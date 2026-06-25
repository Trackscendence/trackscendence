import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '@/services/auth'
import Button from '@/components/Button'
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
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[414px]">
        <h1 className="mb-8 text-center text-5xl font-semibold text-[#081934] uppercase">
          Forgot password
        </h1>

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

          <Button type="submit" variant="blue" disabled={isSubmitting}>
            {isSubmitting ? 'Sending request' : 'Send reset instructions'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[#081934]">
          Remembered your password?{' '}
          <Link
            className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
            to="/login"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
