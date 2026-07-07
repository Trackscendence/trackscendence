import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import LoadingSpinner from '@/components/LoadingSpinner'
import OAuth42Error from './_components/OAuth42Error'
import SignInSuccess from './_components/SignInSuccess'
import {
  readCallbackParams,
  resolveLoginResult,
  selectCallbackView,
} from './_utils/fortyTwoCallback'

// How long the "Signed in" confirmation stays up before landing in the waiting
// room — long enough to register, short enough not to feel like a wait.
const SUCCESS_DWELL_MS = 1500

const OAuth42Callback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [requestError, setRequestError] = useState('')
  const [signedInUser, setSignedInUser] = useState(null)
  // React 18 strict mode mounts twice; the authorization code is single-use.
  const hasHandledCallback = useRef(false)

  const { code, state, paramError } = readCallbackParams((key) =>
    searchParams.get(key),
  )

  useEffect(() => {
    if (paramError || hasHandledCallback.current) return
    hasHandledCallback.current = true

    const completeLogin = async () => {
      try {
        const result = await useAuthStore
          .getState()
          .completeFortyTwoLogin({ code, state })

        const outcome = resolveLoginResult(result)

        if (outcome.type === 'twoFactor') {
          navigate('/login', {
            replace: true,
            state: { twoFactorChallenge: outcome.challenge },
          })
          return
        }

        // Confirm the sign-in briefly before the redirect, so it reads as
        // completed rather than a silent jump into the waiting room.
        setSignedInUser(outcome.user)
      } catch (loginError) {
        setRequestError(loginError.message)
      }
    }

    completeLogin()
  }, [code, state, paramError, navigate])

  useEffect(() => {
    if (!signedInUser) return
    const timer = setTimeout(
      () => navigate('/', { replace: true }),
      SUCCESS_DWELL_MS,
    )
    return () => clearTimeout(timer)
  }, [signedInUser, navigate])

  const error = paramError || requestError
  const view = selectCallbackView({ error, signedInUser })

  if (view === 'error') return <OAuth42Error message={error} />

  if (view === 'success')
    return <SignInSuccess username={signedInUser.username} />

  return (
    <LoadingSpinner
      className="bg-surface-warm text-[#2A1A08]"
      heading="Signing in"
      message="Connecting with 42…"
    />
  )
}

export default OAuth42Callback
