import { useState } from 'react'

const FIELD_CLASS =
  'mt-1.5 w-full rounded-xl border border-[#e8893a2e] bg-[#fdf5ec] px-4 py-2.5 text-base text-[#3d1200] transition outline-none focus:border-[#E8893A] focus:ring-2 focus:ring-[#E8893A]/20'

const ReadOnlyRow = ({ label, value }) => (
  <div className="rounded-xl border border-[#e8893a2e] bg-[#fdf5ec] px-4 py-3">
    <p className="text-xs font-semibold tracking-wide text-[#a07a5c] uppercase">
      {label}
    </p>
    <p className="mt-1 text-base font-semibold break-all text-[#3d1200]">
      {value}
    </p>
  </div>
)

const AccountForm = ({
  email,
  initialBio,
  initialDisplayName,
  isGuest,
  isSubmitting,
  onSave,
  username,
}) => {
  const [form, setForm] = useState({
    bio: initialBio || '',
    displayName: initialDisplayName || '',
  })

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ReadOnlyRow label="Username" value={username} />
        <ReadOnlyRow label="Email" value={isGuest ? 'Guest session' : email} />
      </div>

      <label className="block">
        <span className="text-xs font-semibold tracking-wide text-[#a07a5c] uppercase">
          Display name
        </span>
        <input
          className={FIELD_CLASS}
          maxLength="40"
          name="displayName"
          placeholder={username}
          value={form.displayName}
          onChange={handleChange}
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold tracking-wide text-[#a07a5c] uppercase">
          Bio
        </span>
        <textarea
          className={`${FIELD_CLASS} min-h-28 resize-y`}
          maxLength="280"
          name="bio"
          value={form.bio}
          onChange={handleChange}
        />
        <span className="mt-1.5 block text-xs text-[#8a6845]">
          {form.bio.length}/280 characters
        </span>
      </label>

      <div className="flex justify-end">
        <button
          className="rounded-xl bg-[#E8893A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf7526] focus-visible:ring-2 focus-visible:ring-[#E8893A] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Saving' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default AccountForm
