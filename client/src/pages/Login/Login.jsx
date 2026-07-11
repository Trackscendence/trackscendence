import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import AuthPageShell from '@/components/AuthPageShell'
import FortyTwoButton from '@/components/FortyTwoButton'
import LoadingSpinner from '@/components/LoadingSpinner'
import TextLink from '@/components/TextLink'
import GuestLoginButton from './_components/GuestLoginButton'
import LoginForm from './_components/LoginForm'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isFortyTwoLoginEnabled = useAuthStore(
    (state) => state.isFortyTwoLoginEnabled,
  )
  const isAuthProvidersLoading = useAuthStore(
    (state) => state.isAuthProvidersLoading,
  )
  // `startFortyTwoLogin` is a full-page navigation the browser only performs
  // once the server answers with its 302, so the click otherwise looks dead.
  // Flipping this on click gives immediate feedback (spinner + disabled
  // buttons) until the page is replaced.
  const [isConnectingFortyTwo, setIsConnectingFortyTwo] = useState(false)
  // The 2FA challenge is a continuation of one login in progress, so the
  // alternative sign-in options are hidden while it shows. Seed from the OAuth
  // challenge so the block never flashes before LoginForm reports its step.
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(
    Boolean(location.state?.twoFactorChallenge),
  )

  // Re-check provider availability whenever the login screen is shown, so the
  // 42 button recovers if the startup probe missed.
  useEffect(() => {
    useAuthStore.getState().loadAuthProviders()
  }, [])

  useEffect(() => {
    if (!isConnectingFortyTwo) return
    useAuthStore.getState().startFortyTwoLogin()
  }, [isConnectingFortyTwo])

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
    <AuthPageShell title="LOG IN">
      {message ? (
        <p className="mb-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
          {message}
        </p>
      ) : null}

      <LoginForm
        initialTwoFactorState={location.state?.twoFactorChallenge || null}
        onTwoFactorActiveChange={setIsTwoFactorStep}
        onSuccess={() => navigate(from, { replace: true })}
      />

      {!isTwoFactorStep ? (
        <>
          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-black" />
            <span className="text-sm font-medium text-black">OR</span>
            <div className="h-px flex-1 bg-black" />
          </div>

          <GuestLoginButton
            disabled={isConnectingFortyTwo}
            onSuccess={() => navigate(from, { replace: true })}
          />

          <div className="mt-3">
            <FortyTwoButton
              comingSoon={!isAuthProvidersLoading && !isFortyTwoLoginEnabled}
              isChecking={isAuthProvidersLoading && !isFortyTwoLoginEnabled}
              isConnecting={isConnectingFortyTwo}
              onClick={
                isFortyTwoLoginEnabled
                  ? () => setIsConnectingFortyTwo(true)
                  : undefined
              }
            />
          </div>

          <p className="mt-5 text-center text-sm text-[#081934]">
            New player? <TextLink to="/signup">Sign up</TextLink>
          </p>
          <p className="mt-3 text-center text-sm text-[#081934]">
            <TextLink to="/forgot-password">Forgot your password?</TextLink>
          </p>
        </>
      ) : null}
    </AuthPageShell>
  )
}

export default Login
