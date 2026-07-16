import { useEffect, useState } from 'react'

// How long your turn may sit untouched before the splash nudges you.
const IDLE_DELAY_MS = 4000

// A "YOUR TURN!" splash that fades in after your turn has gone untouched for a
// few seconds and clears the moment you act. The idle timer is keyed to the
// current deadline: it marks that deadline "ready" only after IDLE_DELAY_MS,
// and the splash shows only while that mark still matches the live turn. Acting
// changes isMyTurn or the deadline (a draw re-arms the clock), which drops the
// match and hides the splash. setState lives in the timer callback, never in
// the effect body, so there is no cascading render.
const TurnSplash = ({ isMyTurn, expiresAt }) => {
  const [readyFor, setReadyFor] = useState(null)

  useEffect(() => {
    if (!isMyTurn || !expiresAt) return undefined
    const timer = setTimeout(() => setReadyFor(expiresAt), IDLE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isMyTurn, expiresAt])

  const visible = isMyTurn && expiresAt != null && readyFor === expiresAt
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div className="mx-4 rounded-2xl border border-[#FFB04F]/40 bg-black/80 px-8 py-6 text-center shadow-xl sm:px-14 sm:py-8">
        <p className="text-3xl font-extrabold tracking-wide text-white sm:text-5xl">
          YOUR TURN!
        </p>
        <p className="mt-2 text-sm font-medium text-white/60">
          Play a card or draw from the pile
        </p>
      </div>
    </div>
  )
}

export default TurnSplash
