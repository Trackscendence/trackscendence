import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import LegalFooter from '@/components/LegalFooter'

const AppLayout = () => {
  const location = useLocation()
  const isGameRoute = location.pathname.startsWith('/game')
  const mainClassName = isGameRoute
    ? 'w-full flex-1'
    : 'mx-auto w-full max-w-5xl flex-1 px-5 py-8'

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f2] text-[#1f2d28]">
      <AppHeader />
      <main className={mainClassName}>
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  )
}

export default AppLayout
