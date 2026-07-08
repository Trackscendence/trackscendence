import { useEffect, useRef } from 'react'
import ChatMessage from '../ChatMessage'

// Keeps the newest message in view as the log grows. Owning the scroll ref here
// (rather than in the container) keeps this a self-contained presentation
// concern — the container just hands down the messages.
const ChatMessageList = ({ messages, ownUserId }) => {
  const scrollRef = useRef(null)

  useEffect(() => {
    const container = scrollRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  return (
    <ul
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-12 pb-4"
      ref={scrollRef}
    >
      {messages.length > 0 ? (
        messages.map((item) => (
          <ChatMessage
            isOwn={String(item.user.id) === String(ownUserId)}
            key={item.id}
            message={item.message}
            user={item.user}
          />
        ))
      ) : (
        <li className="pt-4 text-center text-sm font-medium text-black/45">
          No messages yet
        </li>
      )}
    </ul>
  )
}

export default ChatMessageList
