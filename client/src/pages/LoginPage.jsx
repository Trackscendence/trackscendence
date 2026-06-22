import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { validateLoginInput } from '../services/auth.validations'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading, login } = useAuth()
  const [form, setForm] = useState({
    identifier: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const from = location.state?.from?.pathname || '/'
  const params = new URLSearchParams(location.search)
  const passwordChanged = params.get('passwordChanged') === '1'
  const message =
    location.state?.message ||
    (passwordChanged
      ? 'Password updated successfully. Please log in again.'
      : '')

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f2] text-sm font-medium text-[#27352f]">
        Loading session
      </div>
    )
  }

  if (isAuthenticated && !isSubmitting) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    setError('')
    setValidationDetails({})
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validations = validateLoginInput(form)

    if (!validations.isValid) {
      setValidationDetails(validations.errors)
      return
    }

    setIsSubmitting(true)

    try {
      await login(validations.normalizedData)
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
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
          <h1 className="mt-2 text-2xl font-semibold">Log in</h1>
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
            {message}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Email or username</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="identifier"
              type="text"
              autoComplete="username"
              value={form.identifier}
              onChange={handleChange}
              required
            />

            {validationDetails.identifier ? (
              <p className="mt-1 text-sm text-[#8a321f]">
                {validationDetails.identifier}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
            />

            {validationDetails.email ? (
              <p className="mt-1 text-sm text-[#8a321f]">
                {validationDetails.email}
              </p>
            ) : null}
          </label>

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
            {isSubmitting ? 'Logging in' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#50635a]">
          New player?{' '}
          <Link
            className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
            to="/signup"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-[#50635a]">
          <Link
            className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
            to="/forgot-password"
          >
            Forgot your password?
          </Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
