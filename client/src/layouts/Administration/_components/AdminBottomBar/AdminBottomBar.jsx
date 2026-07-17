import { NavLink, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { ADMIN_SECTIONS } from '../../adminNavItems'

// The rail's phone form (#496, spec §6b): a fixed, thumb-reachable bottom tab
// bar instead of a hamburger, so the operator identity survives the viewport
// change. Only the live sections appear here — the phased ones would waste
// tap space — plus a way back to the player app. Tap targets stay ≥44px.
const AdminBottomBar = () => (
  <nav
    aria-label="Console sections"
    className="border-admin-ink/10 bg-admin-surface fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-md sm:hidden"
  >
    <ul className="grid grid-cols-3">
      {ADMIN_SECTIONS.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                isActive ? 'text-admin-accent' : 'text-admin-ink/60'
              }`
            }
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            {label}
          </NavLink>
        </li>
      ))}
      <li>
        <Link
          to="/lobby"
          className="text-admin-ink/60 flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          Exit
        </Link>
      </li>
    </ul>
  </nav>
)

export default AdminBottomBar
