import Avatar from '@/components/Avatar'
import getPlayerIdentity from '@/utils/getPlayerIdentity'

// One chat row: the sender's avatar, a compact name label, then the message in a
// bubble. Own messages mirror to the right in a warm orange bubble; everyone
// else's stay on the left in a white bubble — both with dark text so they stay
// legible against the panel. The tail corner (bottom-right for own,
// bottom-left for others) points the bubble back at its avatar. Game-room
// messages only carry { id, username }, so the avatar falls back to initials.
const ChatMessage = ({ isOwn, message, user }) => {
  const { avatarUrl, initials, name } = getPlayerIdentity(user)

  return (
    <li className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar alt={name} initials={initials} size={32} src={avatarUrl} />
      <div
        className={`flex max-w-[78%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}
      >
        <span className="mb-1 px-1 text-xs font-medium text-black/55">
          {name}
        </span>
        <p
          className={`rounded-2xl px-3.5 py-2 text-[15px] leading-snug break-words text-[#2E2D2D] shadow-sm ${
            isOwn ? 'rounded-br-sm bg-[#FFB04F]' : 'rounded-bl-sm bg-white'
          }`}
        >
          {message}
        </p>
      </div>
    </li>
  )
}

export default ChatMessage
