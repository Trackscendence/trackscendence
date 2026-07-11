import { Outlet, useLocation } from 'react-router-dom'
import PlayerSearch from './_components/PlayerSearch'
import AppHeader from '@/components/AppHeader'
import LegalFooter from '@/components/LegalFooter'

const ProfileLayout = () => {
  const { pathname } = useLocation()
  // The player search belongs to the signed-in user's own profile only, not
  // the public /users/:username view or /leaderboard this layout also wraps.
  const showSearch = pathname === '/profile'

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1f2d28]">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 px-8 py-4">
        <div className="">{showSearch ? <PlayerSearch /> : null}</div>
        <div className="mx-auto w-full max-w-[1344px]">
          <Outlet />
        </div>
      </main>
      <LegalFooter />
    </div>
  )
}

export default ProfileLayout
