import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { changePassword } from '@/services/auth'
import usePasswordOperation from '@/hooks/usePasswordOperation'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const ChangePasswordForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const { submit, reset, fail, error, validationDetails, isSubmitting } =
    usePasswordOperation(({ currentPassword, newPassword }) =>
      changePassword(
        { currentPassword, newPassword },
        useAuthStore.getState().token,
      ),
    )

  const handleChange = (event) => {
    reset()
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      fail('Passwords do not match')
      return
    }

    const { ok } = await submit({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    if (ok) onSuccess()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Current password">
        <Input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField
        label="New password"
        hint="Use 8+ characters with upper/lowercase letters, a number, and a symbol."
      >
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField label="Confirm new password">
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
      </FormField>

      {validationDetails.length > 0 ? (
        <div className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {validationDetails.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="blue" disabled={isSubmitting}>
        {isSubmitting ? 'Updating password' : 'Change password'}
      </Button>
    </form>
  )
}

export default ChangePasswordForm
