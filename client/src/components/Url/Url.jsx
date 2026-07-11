import { Link } from 'react-router-dom'

const VARIANTS = {
  auth: 'font-semibold text-[#0196FF] hover:text-[#0080e0]',
  legal: 'font-semibold text-[#2f6f86] hover:text-[#24586a]',
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
