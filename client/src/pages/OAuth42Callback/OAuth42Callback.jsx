import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import LoadingSpinner from '@/components/LoadingSpinner'

const OAuth42Callback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [requestError, setRequestError] = useState('')
  // React 18 strict mode mounts twice; the authorization code is single-use.
  const hasHandledCallback = useRef(false)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const providerError =
    searchParams.get('error_description') || searchParams.get('error')
  const paramError =
    providerError ||
    (!code || !state ? 'The 42 sign-in was cancelled or incomplete.' : '')

  useEffect(() => {
    if (paramError || hasHandledCallback.current) return
    hasHandledCallback.current = true

    const completeLogin = async () => {
      try {
        const result = await useAuthStore
          .getState()
          .completeFortyTwoLogin({ code, state })

        if (result.requiresTwoFactor) {
          navigate('/login', {
            replace: true,
            state: { twoFactorChallenge: result },
          })
          return
        }

        navigate('/', { replace: true })
      } catch (loginError) {
        setRequestError(loginError.message)
      }
    }

    completeLogin()
  }, [code, state, paramError, navigate])

  const error = paramError || requestError

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[414px] text-center">
          <h1 className="mb-4 text-3xl font-semibold text-[#081934]">
            42 sign-in failed
          </h1>
          <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
            {error}
          </p>
          <p className="mt-5 text-sm text-[#081934]">
            <Link
              className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
              to="/login"
            >
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return <LoadingSpinner heading="Signing in" message="Connecting with 42…" />
}

export default OAuth42Callback
