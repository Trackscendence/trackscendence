import { useEffect, useState } from 'react'

// Whole seconds left until the server turn deadline. Null when there is no
// deadline (a bot's turn, or paused), so the banner drops the countdown.
const secondsLeft = (expiresAt) => {
  if (!expiresAt) return null
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
}

// The pill under the center zone that always names the active player and, on a
// timed turn, counts down to the server deadline. It owns only the tick; whose
// turn it is comes down as props. The seconds are derived during render from
// the deadline and current clock; a half-second interval just forces the
// re-render so the last second does not visibly lag. Changing the deadline (new
// turn, or a draw that re-armed the clock) restarts the interval.
const TurnBanner = ({ isMyTurn, activePlayerName, expiresAt }) => {
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!expiresAt) return undefined
    const id = setInterval(() => forceTick((count) => count + 1), 500)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!activePlayerName) return null

  const label = isMyTurn ? 'Your turn' : `${activePlayerName}'s turn`
  const seconds = secondsLeft(expiresAt)

  return (
    <div
      className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 shadow-md"
      role="status"
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full bg-red-500"
      />
      <span className="text-sm font-semibold tracking-wide text-[#FFB04F]">
        {label}
      </span>
      {seconds !== null && (
        <span className="text-base font-extrabold text-white tabular-nums">
          {seconds}s
        </span>
      )}
    </div>
  )
}

export default TurnBanner
