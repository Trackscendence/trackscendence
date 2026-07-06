const STYLES = {
  info: {
    accent: 'bg-[#24356F]',
    frame: 'border-[#c8d0ee] text-[#24356F]',
    label: 'Notice',
  },
  success: {
    accent: 'bg-[#2f7d61]',
    frame: 'border-[#bbd2c3] text-[#24563f]',
    label: 'Done',
  },
  error: {
    accent: 'bg-[#e86d2f]',
    frame: 'border-[#e2a496] text-[#8a321f]',
    label: 'Action blocked',
  },
}

const Toast = ({ message, type = 'info', onDismiss }) => {
  const style = STYLES[type] ?? STYLES.info
  const isError = type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`w-full overflow-hidden rounded-sm border bg-white shadow-[0_18px_40px_rgba(61,18,0,0.18)] ${style.frame}`}
    >
      <div className={`h-1 ${style.accent}`} />
      <div className="flex items-start gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.accent}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide uppercase">
            {style.label}
          </p>
          <p className="mt-1 text-sm leading-5">{message}</p>
        </div>
        {onDismiss && (
          <button
            aria-label="Dismiss notification"
            className="shrink-0 px-1 text-base leading-none font-semibold opacity-70 transition hover:opacity-100 focus:ring-2 focus:ring-current/30 focus:outline-none"
            type="button"
            onClick={onDismiss}
          >
            x
          </button>
        )}
      </div>
    </div>
  )
}

export default Toast
