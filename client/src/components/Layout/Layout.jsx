import { Link, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'

const Layout = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f2] text-[#1f2d28]">
      <header className="border-b border-[#d8dfd4] bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link
            to="/"
            className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase"
          >
            Trackscendence
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-[#617267]">{user.username}</span>
            )}
            <Link
              to="/change-password"
              className="rounded-md border border-[#cbd5c5] px-3 py-1.5 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
            >
              Change password
            </Link>
            <button
              className="rounded-md border border-[#cbd5c5] px-3 py-1.5 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#d8dfd4] bg-white py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-6 px-5 text-xs text-[#50635a]">
          <Link to="/privacy-policy" className="hover:text-[#1f2d28]">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:text-[#1f2d28]">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default Layout
