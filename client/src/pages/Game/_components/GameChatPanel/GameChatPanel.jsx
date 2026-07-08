import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useChatStore, { getGameRoomId } from '@/stores/useChatStore'
import useSocketStore from '@/stores/useSocketStore'
import ChatComposer from './_components/ChatComposer'
import ChatMessageList from './_components/ChatMessageList'

const EMPTY_MESSAGES = []

// The in-game chat overlay (bottom-right of the table). Container: it reads the
// game-room log from the chat store and sends through the socket store, then
// hands the data down to the message-list and composer presenters. The own user
// id is read here (not prop-drilled) so the list can align own messages against
// everyone else's.
const GameChatPanel = ({ gameId, onClose }) => {
  const [message, setMessage] = useState('')
  const roomId = getGameRoomId(gameId)
  const ownUserId = useAuthStore((state) => state.user?.id)
  const messages = useChatStore(
    (state) => state.messages[roomId] || EMPTY_MESSAGES,
  )
  const sendChatMessage = useSocketStore((state) => state.sendChatMessage)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (sendChatMessage(message, roomId)) {
      setMessage('')
    }
  }

  return (
    <section
      aria-label="Game chat"
      className="absolute right-4 bottom-36 z-30 flex max-h-[min(26.5rem,calc(100svh-11rem))] w-[min(25.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-[#FBC17A] shadow-xl"
    >
      <button
        aria-label="Close game chat"
        className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-lg border border-[#7C7B7B] bg-[#FFD5A2] text-lg leading-none text-black/70 transition hover:bg-[#f8c98d] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
      <ChatMessageList messages={messages} ownUserId={ownUserId} />
      <ChatComposer
        onChange={(event) => setMessage(event.target.value)}
        onSubmit={handleSubmit}
        value={message}
      />
    </section>
  )
}

export default GameChatPanel
