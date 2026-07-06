import { Link } from 'react-router-dom'

// The black uppercase "Lobby" chip shared by the profile header and the
// results screen. Renders as a Link to /lobby by default, or as a button when
// an onClick is supplied (the results screen clears the finished game before
// navigating). Sizing and positioning come from className so each context can
// place it; the visual identity (black, uppercase, hover orange) stays here.
const BASE_CLASS =
  'inline-flex items-center justify-center gap-1 bg-black text-sm font-semibold text-white uppercase transition hover:bg-[#f2652a] focus:ring-2 focus:ring-[#f2652a]/35 focus:outline-none'

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

const LobbyChip = ({ onClick, className = '' }) => {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${BASE_CLASS} ${className}`}
      >
        <ChipContent />
      </button>
    )
  }

  return (
    <Link to="/lobby" className={`${BASE_CLASS} ${className}`}>
      <ChipContent />
    </Link>
  )
}

export default LobbyChip
