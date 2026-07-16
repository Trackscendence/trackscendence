import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '@/stores/useGameStore'
import exitIcon from '@/assets/game/emergency-exit.svg'
import ForfeitConfirmModal from '../ForfeitConfirmModal'

// The in-game exit is a forfeit, not a plain navigation: confirming ends the
// game for everyone (game:leave), then this client returns to the lobby. The
// server reopens the room so the players left behind wait together for a new
// game.
const ExitGameButton = () => {
  const navigate = useNavigate()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const confirmLeave = () => {
    useGameStore.getState().leaveGame()
    setIsConfirmOpen(false)
    navigate('/lobby')
  }

  return (
    <>
      <button
        aria-label="Exit game"
        className="focus-visible:ring-offset-surface-warm absolute top-3 right-3 z-20 size-10 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none sm:top-4 sm:right-4 sm:size-12"
        onClick={() => setIsConfirmOpen(true)}
        type="button"
      >
        <img alt="Exit game" className="size-full" src={exitIcon} />
      </button>
      <ForfeitConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmLeave}
      />
    </>
  )
}

export default ExitGameButton
