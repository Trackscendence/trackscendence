import { useState } from 'react'

export function useForm({ initialValues, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(values)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message || 'An error occurred')
      } else {
        setError(err.message || 'An unexpected error occurred')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    values,
    error,
    isSubmitting,
    handleChange,
    handleSubmit,
    setError,
    setValues,
  }
}
