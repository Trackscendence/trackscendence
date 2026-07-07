import Modal from '@/components/Modal'
import Button from '@/components/Button'

// Shown when a player presses the in-game exit: leaving forfeits the match, so
// it ends for everyone at the table. Confirming emits the forfeit; cancelling
// drops back to the game.
const ForfeitConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave the game?">
      <p className="text-sm text-[#50635a]">
        Leaving ends the game for everyone at the table. The other players are
        sent back to wait for a new game.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="orangeOutline" fullWidth onClick={onClose}>
          Keep playing
        </Button>
        <Button variant="orange" fullWidth onClick={onConfirm}>
          Leave the game
        </Button>
      </div>
    </Modal>
  )
}

export default ForfeitConfirmModal
