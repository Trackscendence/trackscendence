import { UserRoundCheck } from 'lucide-react'

/* The check sits on the saturated orange bubble, where near-luminance colors
   (slate grey, mid greens) go muddy. Sent is translucent white — the tone
   that reads as grey on the bubble — and read is a purple that stays visible
   through hue contrast with the orange. */
const ReadReceiptCheck = ({
  isRead,
  readColor = '#7f6ec4',
  sentColor = 'rgba(255, 255, 255, 0.65)',
}) => (
  <span className="inline-flex items-center">
    <UserRoundCheck
      aria-hidden="true"
      className="h-3.5 w-3.5 transition-colors duration-300"
      color={isRead ? readColor : sentColor}
      strokeWidth={2.25}
    />
    <span className="sr-only">{isRead ? 'Read' : 'Sent'}</span>
  </span>
)

export default ReadReceiptCheck
