import { Handshake, Mailbox, UserX } from 'lucide-react'

// The friends pair (#395): the status chip states the relationship and, on
// hover, offers the exit (the handshake swaps to UserX for unfriending); the
// mailbox opens the conversation. Both share the same h-10 footprint so the
// pair reads as one control.
const FriendsPair = ({ displayName, isSubmitting, onMessage, onUnfriend }) => (
  <div className="flex shrink-0 items-center gap-2">
    <button
      aria-label={`Unfriend ${displayName}`}
      title="Friends"
      className="group flex h-10 w-14 items-center justify-center border border-[#e86d2f] bg-white text-[#e86d2f] transition hover:border-[#b6523b] hover:bg-[#fdf1ee] hover:text-[#b6523b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d1200]/25 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSubmitting}
      type="button"
      onClick={onUnfriend}
    >
      <Handshake aria-hidden="true" className="h-5 w-5 group-hover:hidden" />
      <UserX aria-hidden="true" className="hidden h-5 w-5 group-hover:block" />
    </button>
    <button
      aria-label={`Message ${displayName}`}
      title="Message"
      className="flex h-10 w-14 items-center justify-center bg-[#e86d2f] text-white transition hover:bg-[#c95b24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d1200]/25 disabled:cursor-not-allowed disabled:bg-[#dda37e]"
      disabled={isSubmitting}
      type="button"
      onClick={onMessage}
    >
      <Mailbox aria-hidden="true" className="h-5 w-5" />
    </button>
  </div>
)

export default FriendsPair
