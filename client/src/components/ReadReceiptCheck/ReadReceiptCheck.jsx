import { Check } from 'lucide-react'

/* On the saturated orange bubble no flat green stays legible (the brand green
   sits at ~1.3:1 contrast), so the read state seats the check on a white disc
   instead. Sent state is translucent white — the tone that reads as grey on
   the bubble without going muddy. */
const ReadReceiptCheck = ({
  isRead,
  readColor = '#3fbf4e',
  sentColor = 'rgba(255, 255, 255, 0.65)',
}) => (
  <span
    className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-300 ${
      isRead ? 'bg-white' : ''
    }`}
  >
    <Check
      aria-hidden="true"
      className={`transition-colors duration-300 ${
        isRead ? 'h-[11px] w-[11px]' : 'h-4 w-4'
      }`}
      color={isRead ? readColor : sentColor}
      strokeWidth={isRead ? 4 : 3.25}
    />
    <span className="sr-only">{isRead ? 'Read' : 'Sent'}</span>
  </span>
)

export default ReadReceiptCheck
