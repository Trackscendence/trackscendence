const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const WinRateRing = ({ rate }) => {
  const dash = (rate / 100) * CIRCUMFERENCE

  return (
    <svg
      aria-label={`Win rate ${rate}%`}
      className="mx-auto"
      height="96"
      role="img"
      viewBox="0 0 96 96"
      width="96"
    >
      <circle
        cx="48"
        cy="48"
        fill="none"
        r={RADIUS}
        stroke="#fceee0"
        strokeWidth="8"
      />
      <circle
        cx="48"
        cy="48"
        fill="none"
        r={RADIUS}
        stroke="#e86d2f"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        strokeLinecap="round"
        strokeWidth="8"
        transform="rotate(-90 48 48)"
      />
      <text
        dominantBaseline="central"
        fill="#3d1200"
        fontSize="16"
        fontWeight="700"
        textAnchor="middle"
        x="48"
        y="44"
      >
        {rate}%
      </text>
      <text fill="#7a3810" fontSize="9" textAnchor="middle" x="48" y="60">
        WIN RATE
      </text>
    </svg>
  )
}

export default WinRateRing
