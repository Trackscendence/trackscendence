import { Link, useNavigate } from 'react-router-dom'
import useAuth from '@/context/useAuth'
import { useForm } from '@/hooks/useForm'
import { AuthLayout } from '@/layouts'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

const SignupPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { values, error, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', username: '', password: '' },
    onSubmit: async (formValues) => {
      await register(formValues)
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in to continue.' },
      })
    },
  })

  return (
    <AuthLayout title="Create your account">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Username"
          name="username"
          type="text"
          autoComplete="username"
          value={values.username}
          onChange={handleChange}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
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
    </AuthLayout>
  )
}

export default SignupPage
