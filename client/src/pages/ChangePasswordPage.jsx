import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { AUTH_TOKEN_KEY, changePassword } from '../services/auth'

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    setError('')
    setValidationDetails([])

    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setValidationDetails([])

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      await changePassword(
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        token,
      )
      localStorage.removeItem(AUTH_TOKEN_KEY)
      window.location.replace('/login?passwordChanged=1')
    } catch (requestError) {
      const details = Array.isArray(requestError.payload?.details)
        ? requestError.payload.details
        : []

      setValidationDetails(details)
      setError(details.length > 0 ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
      <section className="w-full max-w-md rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <div className="mb-7">
          <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
            Trackscendence
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Change password</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Current password</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">New password</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
            <p className="mt-2 text-xs text-[#50635a]">
              Use 8+ characters with upper/lowercase letters, a number, and a
              symbol.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Confirm new password</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>

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

          <button
            className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating password' : 'Change password'}
          </button>
        </form>

        <button
          className="mt-5 w-full rounded-md border border-[#cbd5c5] bg-transparent px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
          type="button"
          onClick={() => navigate('/')}
        >
          Back to session
        </button>
      </section>
    </main>
  )
}

export default ChangePasswordPage
