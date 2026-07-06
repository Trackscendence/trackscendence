import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LobbyChip from '@/components/LobbyChip'
import PlayerSearch from './_components/PlayerSearch'

const ProfileLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The player search belongs to the signed-in user's own profile only, not
  // the public /users/:username view or /leaderboard this layout also wraps.
  const showSearch = pathname === '/profile'

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#1f2d28]">
      {/* Back and Lobby stay flush in the top corners; the search sits between
          them on the same line, top-aligned with the two tabs. */}
      <header className="relative z-20 flex items-start gap-4">
        <button
          className="flex h-[27px] w-[138px] shrink-0 items-center justify-center gap-1 border-2 border-black bg-white text-sm font-semibold text-black uppercase transition hover:bg-black hover:text-white focus:ring-2 focus:ring-black/25 focus:outline-none"
          type="button"
          onClick={() => navigate(-1)}
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 16 16"
          >
            <path
              d="M10 3 5 8l5 5M5.5 8H14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          Back
        </button>

        <div className="flex flex-1 justify-center px-4">
          {showSearch ? <PlayerSearch /> : null}
        </div>

        <LobbyChip className="h-[27px] w-[138px] shrink-0" />
      </header>

      <main className="w-full flex-1 px-5 pt-8 pb-12">
        <div className="mx-auto w-full max-w-[1344px]">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-[#d8dfd4] bg-white py-4">
        <div className="flex w-full items-center justify-center gap-6 px-5 text-xs text-[#50635a]">
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

export default ProfileLayout
