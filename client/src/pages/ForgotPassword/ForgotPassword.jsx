import { useState } from 'react'
import { requestPasswordReset } from '@/services/auth'
import usePasswordOperation from '@/hooks/usePasswordOperation'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import Url from '@/components/Url'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const { submit, reset, error, validationDetails, isSubmitting } =
    usePasswordOperation(requestPasswordReset)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const { ok, result } = await submit({ email })
    if (ok) setMessage(result.message)
  }

  return (
    <>
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
              reset()
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
        Remembered your password? <Url to="/login">Log in</Url>
      </p>
    </>
  )
}

export default ForgotPassword
