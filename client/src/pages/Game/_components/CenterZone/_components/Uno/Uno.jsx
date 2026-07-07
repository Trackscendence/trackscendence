import UnoArrow from './_components/UnoArrow'

// The UNO! call-out pill. As a passive badge (no onClick) it is a one-card
// warning. As a button it is an action: your own call to stay safe, or a catch
// on an opponent who forgot. `arrow` adds a bouncing nudge above your own call
// button; the button pulses so it reads as actionable.

const PILL =
  'rounded-full bg-[#EA5A2A] px-4 py-1.5 text-sm font-black tracking-normal text-white shadow-md ring-2 ring-white'
const BUTTON = `${PILL} focus-visible:ring-offset-surface-warm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none`

const Uno = ({ onClick, arrow = false, label = 'UNO!', title }) => {
  if (!onClick) return <span className={PILL}>{label}</span>

  return (
    <div className="relative flex flex-col items-center">
      {arrow && (
        <UnoArrow className="absolute -top-7 animate-bounce text-[#EA5A2A]" />
      )}
      <button
        className={`${BUTTON} animate-pulse`}
        onClick={onClick}
        title={title}
        type="button"
      >
        {label}
      </button>
    </div>
  )
}

export default Uno
