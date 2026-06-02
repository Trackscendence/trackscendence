import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/auth'

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams()
	const [form, setForm] = useState({
		token: searchParams.get('token') || '',
		newPassword: '',
		confirmPassword: '',
	})
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const navigate = useNavigate()
	const tokenFromUrl = searchParams.get('token') || ''

	useEffect(() => {
		setForm((currentForm) => {
			if (currentForm.token === tokenFromUrl) {
				return currentForm
			}

			return {
				...currentForm,
				token: tokenFromUrl,
			}
		})
	}, [tokenFromUrl])

	const handleChange = (event) => {
		setForm((currentForm) => ({
			...currentForm,
			[event.target.name]: event.target.value,
		}))
	}

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError('')
		setMessage('')

		if (form.newPassword !== form.confirmPassword) {
			setError('Passwords do not match')
			return
		}

		setIsSubmitting(true)

		try {
			await resetPassword({ token: form.token, newPassword: form.newPassword })
			navigate('/login', {
				replace: true,
				state: { message: 'Password has been reset. Sign in with your new password.' },
			})
		} catch (requestError) {
			setError(requestError.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
			<section className="w-full max-w-md rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
				<div className="mb-7">
					<p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#bd4f35]">Trackscendence</p>
					<h1 className="mt-2 text-2xl font-semibold">Reset password</h1>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<label className="block">
						<span className="text-sm font-medium">Reset token</span>
						<input
							className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base outline-none transition focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
							name="token"
							type="text"
							autoComplete="one-time-code"
							value={form.token}
							onChange={handleChange}
							required
						/>
					</label>

					<label className="block">
						<span className="text-sm font-medium">New password</span>
						<input
							className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base outline-none transition focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
							name="newPassword"
							type="password"
							autoComplete="new-password"
							value={form.newPassword}
							onChange={handleChange}
							required
						/>
						<p className="mt-2 text-xs text-[#50635a]">Use 8+ characters with upper/lowercase letters, a number, and a symbol.</p>
					</label>

					<label className="block">
						<span className="text-sm font-medium">Confirm new password</span>
						<input
							className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base outline-none transition focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							value={form.confirmPassword}
							onChange={handleChange}
							required
						/>
					</label>

					{error ? (
						<p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">{error}</p>
					) : null}

					<button
						className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Resetting password' : 'Reset password'}
					</button>
				</form>

				{message ? (
					<p className="mt-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">{message}</p>
				) : null}

				<p className="mt-5 text-center text-sm text-[#50635a]">
					Remembered your password?{' '}
					<Link className="font-semibold text-[#2f6f86] hover:text-[#24586a]" to="/login">
						Log in
					</Link>
				</p>
			</section>
		</main>
	)
}

export default ResetPasswordPage
