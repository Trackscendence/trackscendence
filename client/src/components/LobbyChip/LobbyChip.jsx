import { Link } from 'react-router-dom'

// The black uppercase "Lobby" chip shared by the profile header and results.
// It renders as a Link by default, or as a button when the caller must clear
// state before navigating. Sizing and positioning come from className.
const BASE_CLASS =
  'inline-flex items-center justify-center gap-1 bg-black text-sm font-semibold text-white uppercase transition focus:ring-2 focus:outline-none'

const VARIANT_CLASSES = {
  default: 'hover:bg-[#f2652a] focus:ring-[#f2652a]/35',
  neutral: 'hover:bg-[#2f2925] focus:ring-[#2f2925]/35',
}

const ChipContent = () => (
  <>
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4 3l9 9M12 3 3 12M3 3l2 2M13 3l-2 2M3 13l2-2M13 13l-2-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
    Lobby
  </>
)

const LobbyChip = ({ className = '', onClick, variant = 'default' }) => {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default
  const buttonClass = `${BASE_CLASS} ${variantClass} ${className}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={buttonClass}>
        <ChipContent />
      </button>
    )
  }

  return (
    <Link to="/lobby" className={buttonClass}>
      <ChipContent />
    </Link>
  )
}

export default LobbyChip
