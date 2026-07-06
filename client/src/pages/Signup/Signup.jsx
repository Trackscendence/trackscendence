import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import FortyTwoButton from '@/components/FortyTwoButton'
import SignupForm from './_components/SignupForm'

const Signup = () => {
  const navigate = useNavigate()
  const isFortyTwoLoginEnabled = useAuthStore(
    (state) => state.isFortyTwoLoginEnabled,
  )

  // Re-check provider availability on mount so the 42 button recovers if the
  // startup probe missed.
  useEffect(() => {
    useAuthStore.getState().loadAuthProviders()
  }, [])

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[414px]">
        <h1 className="mb-8 text-center text-5xl font-semibold text-[#081934] uppercase">
          Create your profile
        </h1>

        <SignupForm
          onSuccess={() => navigate('/signup/success', { replace: true })}
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
          Already have an account?{' '}
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

export default Signup
