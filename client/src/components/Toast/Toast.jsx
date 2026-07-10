import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

// Branded toast palette: the deep blue with its lighter accent carries the
// positive tone, the red carries the negative one, and info stays a quiet
// white card in the same blue family. Solid fills read instantly from the
// corner of the eye without the label doing the work.
const STYLES = {
  info: {
    frame: 'border border-[#0B2D88]/25 bg-white text-[#0B2D88]',
    icon: Info,
    iconColor: 'text-[#5B86FC]',
    label: 'Notice',
  },
  success: {
    frame: 'bg-[#0B2D88] text-white',
    icon: CircleCheck,
    iconColor: 'text-[#5B86FC]',
    label: 'Done',
  },
  error: {
    frame: 'bg-[#E03325] text-white',
    icon: CircleAlert,
    iconColor: 'text-white',
    label: 'Action blocked',
  },
}

const Toast = ({ message, type = 'info', onDismiss }) => {
  const style = STYLES[type] ?? STYLES.info
  const ToneIcon = style.icon
  const isError = type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`w-full overflow-hidden rounded-lg shadow-[0_12px_32px_rgba(11,45,136,0.28)] ${style.frame}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <ToneIcon
          aria-hidden="true"
          className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide uppercase opacity-80">
            {style.label}
          </p>
          <p className="mt-0.5 text-sm leading-5 font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            aria-label="Dismiss notification"
            className="shrink-0 rounded-full p-0.5 opacity-70 transition hover:opacity-100 focus:ring-2 focus:ring-current/40 focus:outline-none"
            type="button"
            onClick={onDismiss}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Toast
