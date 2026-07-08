// Pure, React-free core of usePasswordOperation. The hook injects the useState
// setters; everything else (the submit lifecycle and how a caught error maps to
// display state) lives here so it can be unit-tested without a React renderer,
// mirroring the createCurrentProfileLoader pattern in the stores.

// Split a caught operation error into what the form should show: server-supplied
// field messages (payload.details) take over and the plain error line is
// cleared; otherwise fall back to the error's message.
export const deriveSubmitError = (operationError) => {
  const details = Array.isArray(operationError?.payload?.details)
    ? operationError.payload.details
    : []

  return {
    validationDetails: details,
    error: details.length > 0 ? '' : (operationError?.message ?? ''),
  }
}

export const createPasswordOperation = ({
  operation,
  setError,
  setValidationDetails,
  setIsSubmitting,
}) => {
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
      const { validationDetails, error } = deriveSubmitError(operationError)
      setValidationDetails(validationDetails)
      setError(error)
      return { ok: false, error: operationError }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, reset, fail }
}

export default createPasswordOperation
