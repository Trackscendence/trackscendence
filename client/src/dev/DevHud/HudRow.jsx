// Presenter: one status line in the debug HUD. Pure props, no store reads.
const TONE_DOT = {
  ok: 'bg-[#5FBF77]',
  warn: 'bg-[#FFB04F]',
  down: 'bg-[#E03325]',
  idle: 'bg-[#B39B7C]/50',
}

const HudRow = ({ label, value, tone = 'idle' }) => (
  <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
    <span className="flex items-center gap-2 text-[#B39B7C]">
      <span
        aria-hidden
        className={['inline-block h-2 w-2 rounded-full', TONE_DOT[tone]].join(
          ' ',
        )}
      />
      {label}
    </span>
    <span className="truncate text-right text-[#FDE8CF]">{value}</span>
  </div>
)

export default HudRow
