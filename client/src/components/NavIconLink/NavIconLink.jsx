import { NavLink } from 'react-router-dom'

// The round icon link for the signed-in header (#442). It mirrors the bell and
// mail menu triggers in SocialNavActions so links and menus read as one control
// family, and it fills with the same warm tone the bell uses while open when
// the linked route is active (NavLink also sets aria-current="page" there).
const NavIconLink = ({ to, label, icon: Icon, end = false }) => (
  <NavLink
    to={to}
    end={end}
    aria-label={label}
    title={label}
    className={({ isActive }) =>
      `flex h-9 w-9 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none motion-safe:active:scale-95 ${
        isActive ? 'bg-[#ffbf80]' : ''
      }`
    }
  >
    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
  </NavLink>
)

export default NavIconLink
