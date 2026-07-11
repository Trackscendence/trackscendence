import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

// Duotone toast: the message stays on a white card so it is always readable,
// while a solid tone chip holds the icon and carries the meaning from the
// corner of the eye. The chip, text block, and dismiss all centre on one
// horizontal axis.
const STYLES = {
  info: {
    chip: 'bg-[#51AFF1]',
    icon: Info,
    iconColor: 'text-white',
    label: 'text-[#51AFF1]',
    title: 'Notice',
  },
  success: {
    chip: 'bg-[#489E52]',
    icon: CircleCheck,
    iconColor: 'text-white',
    label: 'text-[#489E52]',
    title: 'Done',
  },
  warning: {
    chip: 'bg-[#F4C745]',
    icon: TriangleAlert,
    iconColor: 'text-[#3d1200]',
    label: 'text-[#b8890a]',
    title: 'Heads up',
  },
  error: {
    chip: 'bg-[#E03325]',
    icon: CircleAlert,
    iconColor: 'text-white',
    label: 'text-[#E03325]',
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
      className="w-full rounded-xl bg-white text-[#1f2d28] shadow-[0_10px_30px_rgba(61,18,0,0.14)]"
    >
      <div className="flex items-center gap-3 py-3 pr-3 pl-2.5">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.chip}`}
        >
          <ToneIcon className={`h-5 w-5 ${style.iconColor}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-bold tracking-wide uppercase ${style.label}`}
          >
            {style.title}
          </p>
          <p className="mt-0.5 text-sm leading-5 font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            aria-label="Dismiss notification"
            className="shrink-0 self-center rounded-full p-1 text-[#1f2d28] opacity-60 transition hover:opacity-100 focus:ring-2 focus:ring-[#1f2d28]/30 focus:outline-none"
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
