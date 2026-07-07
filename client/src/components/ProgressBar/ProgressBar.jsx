// A slim track. `indeterminate` slides a green segment under a faint rail to say
// "working, not frozen" when the duration is unknown (the boot gate); reduced
// motion pins it as a static ~40% fill. Otherwise it's determinate: the fill
// width tracks `value` (0–100). Reusable for uploads or any progress state.
const ProgressBar = ({ value = 0, indeterminate = false, className = '' }) => {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      className={`h-1.5 overflow-hidden rounded-full bg-[#2A1A08]/10 ${className}`}
    >
      {indeterminate ? (
        <div className="bg-uno-green motion-safe:animate-progress-indeterminate h-full w-2/5 rounded-full" />
      ) : (
        <div
          className="bg-uno-green h-full rounded-full transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      )}
    </div>
  )
}

export default ProgressBar
