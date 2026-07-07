// The inlined lucide `loader-circle`. Spins only when motion is allowed; a
// frozen spinner reads as broken, so callers that need a reduced-motion state
// hide it (`motion-reduce:hidden`). Colour comes from the current text colour,
// size from the `size` prop — reusable in buttons, inline states, and the
// loading page.
const Spinner = ({ size = 16, className = '', ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Loading"
      className={`motion-safe:animate-spin ${className}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default Spinner
