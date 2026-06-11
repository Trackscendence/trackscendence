import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '@/context/useAuth'
import { useForm } from '@/hooks/useForm'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading, login } = useAuth()
  const from = location.state?.from?.pathname || '/'
  const params = new URLSearchParams(location.search)
  const passwordChanged = params.get('passwordChanged') === '1'
  const message =
    location.state?.message ||
    (passwordChanged
      ? 'Password updated successfully. Please log in again.'
      : '')

  const { values, error, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues: { identifier: '', password: '' },
    onSubmit: async (formValues) => {
      await login(formValues)
      navigate(from, { replace: true })
    },
  })

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

  return (
    <AuthLayout title="Log in">
      {message && (
        <Alert variant="success" className="mb-4">
          {message}
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email or username"
          name="identifier"
          type="text"
          autoComplete="username"
          value={values.identifier}
          onChange={handleChange}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          required
        />

        {error && <Alert variant="error">{error}</Alert>}

        <Button
          type="submit"
          className="w-full bg-[#2f7d61] hover:bg-[#276a52] text-white"
          isLoading={isSubmitting}
        >
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
    </AuthLayout>
  )
}

export default LoginPage
