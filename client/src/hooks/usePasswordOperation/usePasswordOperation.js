import { useState } from 'react'

// Owns the async lifecycle every password form shares: submit state, the split
// between server-side validation details and a plain error message, and clearing
// them on input. The caller supplies the operation (which auth service call to
// run) and decides what success means (navigate, show a message, call onSuccess).
// This is the single seam password flows program against, so adding a new flow
// costs a few lines instead of re-implementing the try/catch/details parsing.
export const usePasswordOperation = (operation) => {
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setError('')
    setValidationDetails([])
  }

  // Report a client-side failure (e.g. passwords do not match) without hitting
  // the server. Mirrors how a server error renders: a plain message, no details.
  const fail = (message) => {
    setValidationDetails([])
    setError(message)
  }

  const submit = async (payload) => {
    reset()
    setIsSubmitting(true)

    try {
      const result = await operation(payload)
      return { ok: true, result }
    } catch (operationError) {
      const details = Array.isArray(operationError.payload?.details)
        ? operationError.payload.details
        : []

      setValidationDetails(details)
      setError(details.length > 0 ? '' : operationError.message)
      return { ok: false, error: operationError }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, reset, fail, error, validationDetails, isSubmitting }
}

export default usePasswordOperation
