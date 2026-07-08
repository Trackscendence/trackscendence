import Modal from '@/components/Modal'

// The engine validates the declared color against these exact names, so the
// picker sends them verbatim. Swatch hexes match the Card component palette.
const WILD_COLORS = [
  { engineColor: 'RED', label: 'Red', swatchClass: 'bg-[#EA5A2A]' },
  { engineColor: 'YELLOW', label: 'Yellow', swatchClass: 'bg-[#F4C745]' },
  { engineColor: 'GREEN', label: 'Green', swatchClass: 'bg-[#489E52]' },
  { engineColor: 'BLUE', label: 'Blue', swatchClass: 'bg-[#3684CC]' },
]

const WildColorPicker = ({ onCancel, onPick }) => {
  return (
    <Modal isOpen onClose={onCancel} title="Choose a color">
      <div className="grid grid-cols-2 place-items-center gap-3 overflow-visible sm:grid-cols-4 sm:gap-2">
        {WILD_COLORS.map(({ engineColor, label, swatchClass }) => (
          <div
            className="grid h-[72px] w-[72px] place-items-center"
            key={engineColor}
          >
            <button
              aria-label={`Play as ${label.toLowerCase()}`}
              className={`h-14 w-14 rounded-full border-2 border-black/20 ${swatchClass} transform-gpu transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:hover:scale-100`}
              onClick={() => onPick(engineColor)}
              type="button"
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default WildColorPicker
