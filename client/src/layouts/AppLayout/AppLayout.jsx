import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from './_components/Navbar'

const AppLayout = () => {
  const location = useLocation()
  const isGameRoute = location.pathname.startsWith('/game')
  const mainClassName = isGameRoute
    ? 'w-full flex-1'
    : 'mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-5 sm:py-8'

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f7f2] text-[#1f2d28]">
      <Navbar />
      <main className={mainClassName}>
        <Outlet />
      </main>
      <footer className="border-t border-[#d8dfd4] bg-white py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-center text-xs text-[#50635a] sm:px-5">
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

export default AppLayout
