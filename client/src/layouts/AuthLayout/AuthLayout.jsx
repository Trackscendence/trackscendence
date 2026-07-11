import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

const TITLE_SIZES = {
  md: 'text-4xl',
  lg: 'text-5xl',
}

const ROUTE_CONFIG = {
  '/login': {
    nav: { label: 'SIGN UP', to: '/signup' },
    title: 'LOG IN',
  },
  '/signup': {
    nav: { label: 'LOGIN', to: '/login' },
    title: 'Create your profile',
  },
  '/forgot-password': {
    nav: { label: 'LOGIN', to: '/login' },
    title: 'Forgot password',
    titleSize: 'md',
  },
  '/reset-password': {
    nav: { label: 'LOGIN', to: '/login' },
    title: 'Reset password',
  },
}

const DEFAULT_NAV = { label: 'LOGIN', to: '/login' }

const AuthLayout = ({
  children,
  contentClassName = '',
  showHeader = true,
  title,
  titleSize,
}) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const routeConfig = ROUTE_CONFIG[pathname] ?? {}
  const nav = routeConfig.nav ?? DEFAULT_NAV
  const resolvedTitle = title ?? routeConfig.title
  const resolvedTitleSize = titleSize ?? routeConfig.titleSize ?? 'lg'
  const titleClass = TITLE_SIZES[resolvedTitleSize] ?? TITLE_SIZES.lg

  return (
    <div className="bg-surface-warm flex min-h-screen flex-col text-[#081934]">
      {showHeader ? (
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
      ) : null}

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className={`w-full max-w-[414px] ${contentClassName}`}>
          {resolvedTitle ? (
            <h1
              className={`mb-8 text-center ${titleClass} font-semibold text-[#081934] uppercase`}
            >
              {resolvedTitle}
            </h1>
          ) : null}
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
