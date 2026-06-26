import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const LoginForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await useAuthStore.getState().login(form)
      onSuccess()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Email or username">
        <Input
          name="identifier"
          type="text"
          autoComplete="username"
          value={form.identifier}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </FormField>

      {error ? (
        <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="blue" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in' : 'Log in'}
      </Button>
    </form>
  )
}

export default LoginForm
