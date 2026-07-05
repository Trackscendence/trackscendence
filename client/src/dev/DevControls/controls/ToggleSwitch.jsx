// A mechanical toggle for The Rig. Rounded-rect track (instrument, not a soft
// game pill); the knob is a tiny cream card. ON fills with the "you" orange.
const ToggleSwitch = ({ label, hint, checked, onChange }) => {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <span className="font-mono text-[13px] leading-tight text-[#FDE8CF]">
          {label}
        </span>
        {hint ? (
          <span className="mt-1 font-mono text-[11px] leading-tight text-[#B39B7C]">
            {hint}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={[
            'relative h-6 w-11 rounded-md border transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C120A]',
            checked
              ? 'border-[#FFB04F] bg-[#FFB04F]'
              : 'border-[#FDE8CF]/15 bg-[#2B1E12]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-[3px] bg-[#FDE8CF] shadow-sm transition-[left] duration-150 motion-reduce:transition-none',
              checked ? 'left-[22px]' : 'left-[2px]',
            ].join(' ')}
          />
        </button>
        <span
          className={[
            'w-7 font-mono text-[11px] tabular-nums',
            checked ? 'text-[#FFB04F]' : 'text-[#B39B7C]',
          ].join(' ')}
        >
          {checked ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  )
}

export default ToggleSwitch
