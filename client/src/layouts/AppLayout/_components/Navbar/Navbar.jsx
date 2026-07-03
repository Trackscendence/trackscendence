import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'

const Navbar = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="border-b border-[#d8dfd4] bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link
          to="/"
          className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase"
        >
          Trackscendence
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {user && (
            <Link
              to="/profile"
              className="text-sm font-semibold text-[#617267] hover:text-[#1f2d28]"
            >
              {user.displayName || user.username}
            </Link>
          )}
          <Link
            to="/game"
            className="rounded-md border border-[#cbd5c5] px-3 py-1.5 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
          >
            Game
          </Link>
          <Link
            to="/settings"
            className="rounded-md border border-[#cbd5c5] px-3 py-1.5 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
          >
            Settings
          </Link>
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
  )
}

export default Navbar
