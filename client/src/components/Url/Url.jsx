import { Link } from 'react-router-dom'

// A styled router Link for the app's text links. `auth` is the bright blue used
// under the sign-in forms; `muted` is the low-contrast treatment the footer
// uses so its legal links sit quietly on whatever warm surface they land on.
const VARIANTS = {
  auth: 'font-semibold text-[#0196FF] hover:text-[#0080e0]',
  muted: 'text-black/50 transition-colors hover:text-black/80',
}

const Url = ({ children, className = '', variant = 'auth', ...props }) => (
  <Link
    className={`${VARIANTS[variant] ?? VARIANTS.auth} ${className}`}
    {...props}
  >
    {children}
  </Link>
)

export default Url
