// A downward arrow (lucide "arrow-down" geometry) that points at the UNO button
// to nudge the player to call. Presentational only.
const UnoArrow = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="24"
  >
    <line x1="12" x2="12" y1="5" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
)

export default UnoArrow
