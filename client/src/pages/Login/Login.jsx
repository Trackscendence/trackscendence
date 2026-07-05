import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import FortyTwoButton from '@/components/FortyTwoButton'
import LoadingSpinner from '@/components/LoadingSpinner'
import LoginForm from './_components/LoginForm'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading, isFortyTwoLoginEnabled } = useAuthStore()

  const from = location.state?.from?.pathname || '/'
  const params = new URLSearchParams(location.search)
  const passwordChanged = params.get('passwordChanged') === '1'
  const message =
    location.state?.message ||
    (passwordChanged
      ? 'Password updated successfully. Please log in again.'
      : '')

  if (isLoading) return <LoadingSpinner message="Loading session" />
  if (isAuthenticated) return <Navigate to={from} replace />

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[414px]">
        <h1 className="mb-8 text-center text-5xl font-semibold text-[#081934]">
          LOG IN
        </h1>

        {message ? (
          <p className="mb-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
            {message}
          </p>
        ) : null}

        <LoginForm
          initialTwoFactorState={location.state?.twoFactorChallenge || null}
          onSuccess={() => navigate(from, { replace: true })}
        />

        <div className="my-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-black" />
          <span className="text-sm font-medium text-black">OR</span>
          <div className="h-px flex-1 bg-black" />
        </div>

        <FortyTwoButton
          comingSoon={!isFortyTwoLoginEnabled}
          onClick={
            isFortyTwoLoginEnabled
              ? () => useAuthStore.getState().startFortyTwoLogin()
              : undefined
          }
        />

        <p className="mt-5 text-center text-sm text-[#081934]">
          New player?{' '}
          <Link
            className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
            to="/signup"
          >
            Sign up
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-[#081934]">
          <Link
            className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
            to="/forgot-password"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
