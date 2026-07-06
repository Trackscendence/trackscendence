import Modal from '@/components/Modal'

// The room-size picker, shared by the lobby's "Create room" and the waiting
// room's first-player-in case. Pure presenter: the caller decides what picking
// a size does (open a room, then wait). Sizes mirror the server's allowed
// capacities.
const SIZES = [2, 3, 4, 6]

const QuickStartModal = ({ isOpen, onPick, onCancel }) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Quick Start">
      <p className="text-sm text-[#50635a]">
        No room is waiting yet. Choose how many players yours holds, and we will
        seat the others as they arrive.
      </p>
      <div className="mt-6 grid grid-cols-4 gap-3">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onPick(size)}
            className="flex flex-col items-center gap-1 rounded-xl border-2 border-[#e6c9a8] bg-white py-4 transition hover:border-[#EA5A2A] hover:bg-[#fff5ef] focus-visible:ring-2 focus-visible:ring-[#EA5A2A] focus-visible:outline-none"
          >
            <span className="text-2xl font-black text-[#3d1200]">{size}</span>
            <span className="text-xs font-semibold text-[#8a6a52]">
              player{size > 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default QuickStartModal
