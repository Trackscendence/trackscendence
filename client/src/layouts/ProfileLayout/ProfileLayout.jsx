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
      {/* Desktop: Back and Lobby flush in the top corners with the search
          centered between them. Mobile: the two chips share the top row and
          the search wraps onto its own full-width line below. */}
      <header className="relative z-20 flex flex-wrap items-start gap-3 p-3 sm:flex-nowrap sm:gap-4 sm:p-0">
        <BackButton className="h-10 flex-1 sm:h-[27px] sm:w-[138px] sm:flex-none" />
        {showSearch ? (
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:px-4">
            <PlayerSearch
              className="mx-auto w-full max-w-md"
              scope="profile-header"
            />
          </div>
        ) : (
          <div className="hidden flex-1 sm:block" />
        )}
        <LobbyChip className="order-2 h-10 flex-1 sm:order-none sm:h-[27px] sm:w-[138px] sm:flex-none" />
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
