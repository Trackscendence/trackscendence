import { Link, Outlet, useLocation } from 'react-router-dom'
import BackButton from '@/components/BackButton'
import LobbyChip from '@/components/LobbyChip'
import PlayerSearch from '@/components/PlayerSearch'

const ProfileLayout = () => {
  const { pathname } = useLocation()
  // The player search belongs to the signed-in user's own profile only, not
  // the public /users/:username view or /leaderboard this layout also wraps.
  const showSearch = pathname === '/profile'

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-white text-[#1f2d28]">
      {/* Mobile stacks the corner actions so the search field can breathe. */}
      <header className="relative z-20 flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:gap-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <BackButton className="h-10 w-full max-w-[160px] shrink-0 sm:h-[27px] sm:w-[138px]" />
          <LobbyChip className="h-10 w-full max-w-[160px] shrink-0 sm:h-[27px] sm:w-[138px]" />
        </div>

        <div className="w-full flex-1">
          {showSearch ? (
            <PlayerSearch
              className="mx-auto w-full max-w-md"
              scope="profile-header"
            />
          ) : null}
        </div>
      </header>

      <main className="w-full flex-1 px-4 pt-6 pb-10 sm:px-5 sm:pt-8 sm:pb-12">
        <div className="mx-auto w-full max-w-[1344px]">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-[#d8dfd4] bg-white py-4">
        <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-center text-xs text-[#50635a] sm:px-5">
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
