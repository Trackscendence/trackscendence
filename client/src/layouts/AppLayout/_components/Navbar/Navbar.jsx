import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { isAdmin } from '@/utils/authorization'

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
      {/* One row on desktop (brand left, links right), a stacked column on
          phones where each action stays a full-width tap target. */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
        <Link
          to="/"
          className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase"
        >
          Trackscendence
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
          {user ? (
            <Link
              to="/profile"
              className="flex w-full min-w-0 items-center gap-2 text-sm font-semibold text-[#617267] hover:text-[#1f2d28] sm:w-auto sm:gap-3"
            >
              <span className="truncate">
                {user.displayName || user.username}
              </span>
            </Link>
          ) : null}
          <div className="flex flex-col gap-2 sm:contents">
            {isAdmin(user) ? (
              <Link
                to="/admin"
                className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-center text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61] sm:w-auto sm:py-1.5"
              >
                Admin
              </Link>
            ) : null}
            <Link
              to="/game"
              className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-center text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61] sm:w-auto sm:py-1.5"
            >
              Game
            </Link>
            <Link
              to="/settings"
              className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-center text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61] sm:w-auto sm:py-1.5"
            >
              Settings
            </Link>
            {user?.isGuest ? (
              <Link
                to="/settings"
                className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-center text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61] sm:w-auto sm:py-1.5"
              >
                Save progress
              </Link>
            ) : (
              <Link
                to="/change-password"
                className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-center text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61] sm:w-auto sm:py-1.5"
              >
                Change password
              </Link>
            )}
            <button
              className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-center text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61] sm:w-auto sm:py-1.5"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
