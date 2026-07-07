import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// Covers the table while a dropped player rides out their reconnect window
// (Situation 2). The countdown ticks toward the server's deadline; when it runs
// out the server ends the game and routes everyone on, so this only reports the
// wait — it never decides the outcome.
const GamePausedOverlay = ({ names, deadline }) => {
  // Hold the countdown in state and refresh it once a second from the interval
  // callback (never in the effect body, and never read the clock during render)
  // so the two react-hooks lint rules stay happy.
  const [remainingMs, setRemainingMs] = useState(() => deadline - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(deadline - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const waitingFor = names.length > 0 ? names.join(', ') : 'a player'
  const hasExpired = remainingMs <= 0

  return (
    <div className="bg-surface-warm/90 absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
      <LoadingSpinner
        className="bg-transparent text-black"
        heading={hasExpired ? 'Ending the game' : `Waiting for ${waitingFor}`}
        message={
          hasExpired
            ? 'They did not make it back in time.'
            : `Reconnecting… ${formatCountdown(remainingMs)}`
        }
      />
    </div>
  )
}

export default GamePausedOverlay
