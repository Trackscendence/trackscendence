import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuth from '../context/useAuth'
import { socket } from '../services/socket'
const SessionPage = () => {
	const navigate = useNavigate()
	const { logout, user, token } = useAuth()

	const handleLogout = async () => {
		await logout()
		navigate('/login', { replace: true })
	}

	useEffect(() => {
 		socket.connect()
		socket.once('token', (callback) => {
			callback(token)
		})
		return () => {
			socket.disconnect()
		}
	}, [])


	return (
		<main className="min-h-screen bg-[#f4f7f2] text-[#1f2d28]">
			<header className="border-b border-[#d8dfd4] bg-white">
				<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#bd4f35]">Trackscendence</p>
						<h1 className="text-xl font-semibold">Session</h1>
					</div>
					<button
						className="rounded-md border border-[#cbd5c5] px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
						type="button"
						onClick={handleLogout}
					>
						Log out
					</button>
				</div>
			</header>

			<section className="mx-auto w-full max-w-3xl px-5 py-8">
				<div className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold">Signed in</h2>
					<div className="mt-5 grid gap-4 sm:grid-cols-2">
						<div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
							<p className="text-sm font-medium text-[#617267]">Username</p>
							<p className="mt-1 text-base font-semibold">{user.username}</p>
						</div>
						<div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
							<p className="text-sm font-medium text-[#617267]">Role</p>
							<p className="mt-1 text-base font-semibold">{user.role}</p>
						</div>
					</div>
				</div>
			</section>
			
		</main>
	)
}

export default SessionPage
