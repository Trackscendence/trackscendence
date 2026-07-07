import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

const CONTEXTUAL_NAV = {
  '/login': { label: 'SIGN UP', to: '/signup' },
  '/signup': { label: 'LOGIN', to: '/login' },
  '/forgot-password': { label: 'LOGIN', to: '/login' },
  '/reset-password': { label: 'LOGIN', to: '/login' },
}

const AuthLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const nav = CONTEXTUAL_NAV[pathname] ?? { label: 'LOGIN', to: '/login' }

  return (
    <div className="bg-surface-warm flex min-h-screen flex-col text-[#081934]">
      <header className="flex items-start justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex size-11 items-start justify-start text-[#969595] transition hover:text-[#696969] focus-visible:ring-2 focus-visible:ring-[#081934] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <Link
          to={nav.to}
          className="flex h-11 w-[138px] items-center justify-center rounded bg-[#51AFF1] text-xs font-semibold tracking-widest text-white transition-colors hover:bg-[#2F9EEA] focus-visible:ring-2 focus-visible:ring-[#081934] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {nav.label}
        </Link>
      </header>
      <Outlet />
    </div>
  )
}

export default AuthLayout
