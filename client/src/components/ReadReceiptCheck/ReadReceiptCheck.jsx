import { CheckCheck, UserRoundCheck } from 'lucide-react'

/* Delivered is a double check; read swaps to a person-with-check, so the flip
   is a shape change as well as a color change. On the orange bubble the grey
   must be translucent white (real greys go muddy there); callers on white
   surfaces pass their own muted sentColor. */
const ReadReceiptCheck = ({
  isRead,
  readColor = '#7f6ec4',
  sentColor = 'rgba(255, 255, 255, 0.75)',
}) => {
  const Icon = isRead ? UserRoundCheck : CheckCheck
  return (
    <span className="inline-flex items-center">
      <Icon
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-colors duration-300"
        color={isRead ? readColor : sentColor}
        strokeWidth={isRead ? 2.25 : 2.5}
      />
      <span className="sr-only">{isRead ? 'Read' : 'Sent'}</span>
    </span>
  )
}

export default ReadReceiptCheck
