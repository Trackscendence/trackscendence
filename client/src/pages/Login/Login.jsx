import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading, login } = useAuthStore()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
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
    return <LoadingSpinner message="Loading session" />
  }

  if (isAuthenticated && !isSubmitting) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(form)
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
          <FormField label="Email or username">
            <Input
              name="identifier"
              type="text"
              autoComplete="username"
              value={form.identifier}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Password">
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </FormField>

          {error ? (
            <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in' : 'Log in'}
          </Button>
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

export default Login
