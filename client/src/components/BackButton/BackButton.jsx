import { useNavigate } from 'react-router-dom'

// The corner "Back" tab shared by the profile and settings chrome. It steps one
// entry back in history so it works from wherever the page was reached. The
// caller sizes and positions it through `className`.
const BackButton = ({ className = '' }) => {
  const navigate = useNavigate()

  return (
    <button
      className={`flex items-center justify-center gap-1 border-2 border-black bg-white text-sm font-semibold text-black uppercase transition hover:bg-black hover:text-white focus:ring-2 focus:ring-black/25 focus:outline-none ${className}`}
      type="button"
      onClick={() => navigate(-1)}
    >
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          d="M10 3 5 8l5 5M5.5 8H14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      Back
    </button>
  )
}

export default BackButton
