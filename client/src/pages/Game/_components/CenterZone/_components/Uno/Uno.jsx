// The UNO! call-out pill. With an onUnoClick handler it renders as the
// actionable button for the bottom-seat player; without one it is a passive
// badge — an opponent's one-card warning is information, not an action.

const PILL_CLASSES =
  'rounded-full bg-[#EA5A2A] px-4 py-1.5 text-sm font-black tracking-normal text-white shadow-md ring-2 ring-white'

const Uno = ({ onUnoClick }) => {
  if (!onUnoClick) return <span className={PILL_CLASSES}>UNO!</span>

  return (
    <button
      className={`${PILL_CLASSES} focus-visible:ring-offset-surface-warm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none`}
      onClick={onUnoClick}
      type="button"
    >
      UNO!
    </button>
  )
}

export default Uno
