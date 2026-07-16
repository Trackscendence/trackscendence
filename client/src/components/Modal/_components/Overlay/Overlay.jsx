// Placement maps to where the dialog sits in the viewport: centered for quick
// confirmations, top-anchored for taller flows (matching the pattern where the
// dialog hangs from just below the header rather than floating mid-screen).
const PLACEMENTS = {
  center: 'items-center',
  top: 'items-start pt-[8vh]',
}

const Overlay = ({ children, onClick, placement = 'center' }) => {
  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-black/40 p-3 sm:p-5 ${
        PLACEMENTS[placement] ?? PLACEMENTS.center
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Overlay
