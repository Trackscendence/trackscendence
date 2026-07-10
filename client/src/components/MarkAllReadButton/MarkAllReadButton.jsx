import { CheckCheck } from 'lucide-react'

// The boxed double-check control shared by the notification and direct-message
// dropdowns (#380/#381). It reads as "clear the unread badges" and disables
// itself when there is nothing left to clear so the affordance stays honest.
const MarkAllReadButton = ({
  onClick,
  disabled = false,
  label = 'Mark all as read',
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e6c9a8] text-[#7a3810] transition hover:bg-[#fff4e8] focus:ring-2 focus:ring-[#3d1200]/20 focus:outline-none disabled:cursor-not-allowed disabled:border-[#f0d9bd] disabled:text-[#c9ac8a] disabled:hover:bg-transparent"
  >
    <CheckCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
  </button>
)

export default MarkAllReadButton
