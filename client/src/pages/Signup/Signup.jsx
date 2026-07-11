import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import AuthPageShell from '@/components/AuthPageShell'
import FortyTwoButton from '@/components/FortyTwoButton'
import TextLink from '@/components/TextLink'
import SignupForm from './_components/SignupForm'

const Signup = () => {
  const navigate = useNavigate()
  const isFortyTwoLoginEnabled = useAuthStore(
    (state) => state.isFortyTwoLoginEnabled,
  )
  const isAuthProvidersLoading = useAuthStore(
    (state) => state.isAuthProvidersLoading,
  )

  // Re-check provider availability on mount so the 42 button recovers if the
  // startup probe missed.
  useEffect(() => {
    useAuthStore.getState().loadAuthProviders()
  }, [])

  return (
    <AuthPageShell title="Create your profile">
      <SignupForm
        onSuccess={() => navigate('/signup/success', { replace: true })}
      />

      <div className="my-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-black" />
        <span className="text-sm font-medium text-black">OR</span>
        <div className="h-px flex-1 bg-black" />
      </div>

      <FortyTwoButton
        comingSoon={!isAuthProvidersLoading && !isFortyTwoLoginEnabled}
        isChecking={isAuthProvidersLoading && !isFortyTwoLoginEnabled}
        onClick={
          isFortyTwoLoginEnabled
            ? () => useAuthStore.getState().startFortyTwoLogin()
            : undefined
        }
      />

      <p className="mt-5 text-center text-sm text-[#081934]">
        Already have an account? <TextLink to="/login">Log in</TextLink>
      </p>
    </AuthPageShell>
  )
}

export default Signup
