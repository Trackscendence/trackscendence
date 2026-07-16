import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'

const REDIRECT_SECONDS = 5

const SignupSuccess = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)
  const [showCheck, setShowCheck] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowCheck(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (countdown === 0) {
      navigate('/login', { replace: true })
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, navigate])

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-5 sm:py-10">
      <div className="w-full max-w-[414px] text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#0196FF]">
          {showCheck ? (
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 24L20 34L38 14"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span className="text-4xl font-bold text-white">{countdown}</span>
          )}
        </div>

        <h1 className="mb-4 text-3xl font-semibold text-[#081934] uppercase sm:text-4xl">
          Account created
        </h1>

        <p className="mb-8 text-[#081934]">
          Your account is ready. Redirecting to sign in…
        </p>

        <Button
          variant="blue"
          onClick={() => navigate('/login', { replace: true })}
        >
          Sign in now
        </Button>
      </div>
    </div>
  )
}

export default SignupSuccess
