import { NavLink, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ADMIN_SECTIONS, ADMIN_UPCOMING_SECTIONS } from '../../adminNavItems'

// The desktop left rail — the console's one structural signature. Hidden below
// `sm`, where AdminBottomBar takes over; icon-only up to `lg`, labelled from
// `lg`. Active section fills with the accent; the phased sections stay visible
// but inert so the full section map reads at a glance.
const AdminRail = () => (
  <aside className="border-admin-ink/10 bg-admin-surface sticky top-0 hidden h-[100dvh] w-16 shrink-0 flex-col border-r backdrop-blur-sm sm:flex lg:w-56">
    <div className="px-3 pt-5 pb-4 lg:px-5">
      <span className="text-admin-ink hidden text-sm font-black tracking-[0.14em] uppercase lg:block">
        Administration
      </span>
      <span className="text-admin-ink block text-center text-sm font-black lg:hidden">
        A
      </span>
    </div>
    <nav
      aria-label="Console sections"
      className="flex flex-1 flex-col px-2 lg:px-3"
    >
      <ul className="space-y-1">
        {ADMIN_SECTIONS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm font-semibold transition lg:justify-start lg:px-3 ${
                  isActive
                    ? 'bg-admin-accent text-white'
                    : 'text-admin-ink/75 hover:bg-admin-ink/5 hover:text-admin-ink'
                }`
              }
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <ul className="border-admin-ink/10 mt-4 space-y-1 border-t pt-4">
        {ADMIN_UPCOMING_SECTIONS.map(({ label, icon: Icon }) => (
          <li
            key={label}
            aria-disabled="true"
            title={`${label} (coming later)`}
            className="text-admin-muted/70 flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm font-semibold lg:justify-start lg:px-3"
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="hidden flex-1 lg:inline">{label}</span>
            <span className="text-admin-muted hidden rounded-full border border-current px-1.5 text-[10px] font-bold uppercase lg:inline">
              Soon
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pb-5">
        <Link
          to="/lobby"
          title="Back to the app"
          className="text-admin-ink/75 hover:bg-admin-ink/5 hover:text-admin-ink flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm font-semibold transition lg:justify-start lg:px-3"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Back to app</span>
        </Link>
      </div>
    </nav>
  </aside>
)

export default AdminRail
