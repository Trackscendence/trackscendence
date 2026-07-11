import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

// Solid-tone toast: each tone is a full-bleed fill, loud enough to read from
// the corner of the eye mid-game. Green celebrates, sky informs, gold warns,
// red blocks; the warning fill keeps dark text for contrast. Icon, text block,
// and dismiss centre on one horizontal axis.
const STYLES = {
  info: {
    frame: 'bg-[#51AFF1] text-white',
    icon: Info,
    title: 'Notice',
  },
  success: {
    frame: 'bg-[#489E52] text-white',
    icon: CircleCheck,
    title: 'Done',
  },
  warning: {
    frame: 'bg-[#F4C745] text-[#3d1200]',
    icon: TriangleAlert,
    title: 'Heads up',
  },
  error: {
    frame: 'bg-[#E03325] text-white',
    icon: CircleAlert,
    title: 'Action blocked',
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
      className={`w-full rounded-xl shadow-[0_10px_30px_rgba(61,18,0,0.2)] ${style.frame}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <ToneIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wide uppercase opacity-85">
            {style.title}
          </p>
          <p className="mt-0.5 text-sm leading-5 font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            aria-label="Dismiss notification"
            className="shrink-0 rounded-full p-1 opacity-75 transition hover:opacity-100 focus:ring-2 focus:ring-current/40 focus:outline-none"
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
