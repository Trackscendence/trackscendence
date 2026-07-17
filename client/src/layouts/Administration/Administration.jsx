import { Outlet } from 'react-router-dom'
import AdminRail from './_components/AdminRail'
import AdminBottomBar from './_components/AdminBottomBar'

// The operator shell (#496): every /admin section renders inside this route
// layout, visually distinct from the player surface (admin tokens, no player
// header). Desktop gets the persistent left rail; below `sm` the rail becomes
// a fixed bottom tab bar, so content keeps bottom padding clear of it.
const Administration = () => (
  <div className="bg-admin-bg text-admin-ink flex min-h-[100dvh]">
    <AdminRail />
    <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-12 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Outlet />
      </div>
    </main>
    <AdminBottomBar />
  </div>
)

export default Administration
