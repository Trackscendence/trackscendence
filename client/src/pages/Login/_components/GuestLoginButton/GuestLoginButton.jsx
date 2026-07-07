import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'

const GuestLoginButton = ({ onSuccess }) => {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await useAuthStore.getState().loginAsGuest()
      onSuccess()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="orangeOutline"
        disabled={isSubmitting}
        onClick={handleClick}
      >
        {isSubmitting ? 'Starting guest session' : 'Play as guest'}
      </Button>

      {error ? (
        <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default GuestLoginButton
