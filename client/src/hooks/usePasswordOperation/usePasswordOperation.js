import { useState } from 'react'
import { createPasswordOperation } from './createPasswordOperation'

// Thin React shell over createPasswordOperation: owns the three pieces of form
// state and hands their setters to the pure core, which holds the submit
// lifecycle and error mapping. Keeping the logic in the injectable core is what
// makes it unit-testable without a React renderer (see createPasswordOperation.test.js).
export const usePasswordOperation = (operation) => {
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { submit, reset, fail } = createPasswordOperation({
    operation,
    setError,
    setValidationDetails,
    setIsSubmitting,
  })

  return { submit, reset, fail, error, validationDetails, isSubmitting }
}

export default usePasswordOperation
