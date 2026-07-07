// Presenter: the rolling error log at the bottom of the HUD. Pure props.
const KIND_TONE = {
  error: 'text-[#E03325]',
  rejection: 'text-[#E03325]',
  request: 'text-[#FFB04F]',
}

const ErrorList = ({ events, onClear }) => (
  <section className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h3 className="font-mono text-[11px] tracking-wider text-[#B39B7C] uppercase">
        Errors ({events.length})
      </h3>
      {events.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[10px] text-[#B39B7C] hover:text-[#FDE8CF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F]"
        >
          clear
        </button>
      ) : null}
    </div>
    {events.length === 0 ? (
      <p className="font-mono text-[11px] text-[#B39B7C]/60">
        Nothing captured yet.
      </p>
    ) : (
      <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
        {events
          .slice()
          .reverse()
          .map((event) => (
            <li key={event.id} className="font-mono text-[10px] leading-tight">
              <span className={KIND_TONE[event.kind] || 'text-[#FDE8CF]'}>
                {event.label}
              </span>
              {event.detail ? (
                <span className="block text-[#B39B7C]/70">{event.detail}</span>
              ) : null}
            </li>
          ))}
      </ul>
    )}
  </section>
)

export default ErrorList
