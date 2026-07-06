import { Link, Outlet, useLocation } from 'react-router-dom'
import BackButton from '@/components/BackButton'
import LobbyChip from '@/components/LobbyChip'
import PlayerSearch from './_components/PlayerSearch'

const ProfileLayout = () => {
  const { pathname } = useLocation()
  // The player search belongs to the signed-in user's own profile only, not
  // the public /users/:username view or /leaderboard this layout also wraps.
  const showSearch = pathname === '/profile'

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#1f2d28]">
      {/* Back and Lobby stay flush in the top corners; the search sits between
          them on the same line, top-aligned with the two tabs. */}
      <header className="relative z-20 flex items-start gap-4">
        <BackButton className="h-[27px] w-[138px] shrink-0" />

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
