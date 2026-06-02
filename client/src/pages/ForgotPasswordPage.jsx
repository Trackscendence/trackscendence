import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../services/auth'

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const [validationDetails, setValidationDetails] = useState([])
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError('')
		setValidationDetails([])
		setMessage('')
		setIsSubmitting(true)

		try {
			const result = await requestPasswordReset({ email })
			setMessage(result.message)
		} catch (requestError) {
			const details = Array.isArray(requestError.payload?.details) ? requestError.payload.details : []

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
					<p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#bd4f35]">Trackscendence</p>
					<h1 className="mt-2 text-2xl font-semibold">Forgot password</h1>
				</div>

				{message ? (
					<p className="mb-4 rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">{message}</p>
				) : null}

				<form className="space-y-4" onSubmit={handleSubmit}>
					<label className="block">
						<span className="text-sm font-medium">Email</span>
						<input
							className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base outline-none transition focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
							name="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(event) => {
								setError('')
								setValidationDetails([])
								setEmail(event.target.value)
							}}
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
						<p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">{error}</p>
					) : null}

					<button
						className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Sending request' : 'Send reset instructions'}
					</button>
				</form>

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

export default ForgotPasswordPage
