import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

const SignupPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    setError('')
    setValidationDetails([])

    setForm((currentForm) => ({
      ...currentForm,
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
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
      <section className="w-full max-w-md rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <div className="mb-7">
          <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
            Trackscendence
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Create your account</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
            />
            <p className="mt-2 text-xs text-[#50635a]">
              Use letters, numbers, underscores, or hyphens only.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={handleChange}
              required
            />
            <p className="mt-2 text-xs text-[#50635a]">
              Use 8+ characters with upper/lowercase letters, a number, and a
              symbol.
            </p>
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

          <button
            className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account' : 'Sign up'}
          </button>
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
      </section>
    </main>
  )
}

export default SignupPage
