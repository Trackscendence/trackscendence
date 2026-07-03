import { useState } from 'react'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'

const getInitialForm = (profile) => ({
  bio: profile.bio || '',
  displayName: profile.displayName || '',
})

const ProfileEditForm = ({
  error,
  isSubmitting,
  onCancel,
  onSubmit,
  profile,
}) => {
  const [form, setForm] = useState(() => getInitialForm(profile))

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit(form)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormField label="Display name">
        <Input
          maxLength="40"
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
        />
      </FormField>

      <FormField hint={`${form.bio.length}/280 characters`} label="Bio">
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
          maxLength="280"
          name="bio"
          value={form.bio}
          onChange={handleChange}
        />
      </FormField>

      {error && (
        <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          fullWidth={false}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button disabled={isSubmitting} fullWidth={false} type="submit">
          {isSubmitting ? 'Saving' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}

export default ProfileEditForm
