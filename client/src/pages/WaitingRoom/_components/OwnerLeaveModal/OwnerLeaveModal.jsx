import Modal from '@/components/Modal'
import Button from '@/components/Button'

// Shown when the room owner clicks Leave: leaving hands the room to the next
// player, while ending closes it for everyone. Non-owners never see this — the
// container leaves them on the one-click path.
const OwnerLeaveModal = ({ isOpen, onClose, onLeave, onEnd }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave this room?">
      <p className="text-sm text-[#50635a]">
        You own this room. Leave it to hand it to the next player, or end it to
        close it for everyone.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="orangeOutline" fullWidth onClick={onLeave}>
          Leave the room
        </Button>
        <Button variant="orange" fullWidth onClick={onEnd}>
          End the room
        </Button>
      </div>
    </Modal>
  )
}

export default OwnerLeaveModal
