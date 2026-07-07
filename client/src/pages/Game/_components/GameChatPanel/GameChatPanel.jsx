import { useState } from 'react'
import useChatStore, { getGameRoomId } from '@/stores/useChatStore'
import useSocketStore from '@/stores/useSocketStore'

const EMPTY_MESSAGES = []

const GameChatPanel = ({ currentUserId, gameId, onClose }) => {
  const [message, setMessage] = useState('')
  const roomId = getGameRoomId(gameId)
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
      className="absolute right-4 bottom-36 z-30 flex max-h-[min(34rem,calc(100svh-11rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-[#1f2b24]/20 bg-[#fbfcfa] shadow-xl"
    >
      <header className="flex items-center justify-between border-b border-[#e1e6de] bg-white px-4 py-3">
        <h2 className="text-base font-semibold text-[#1f2b24]">Game chat</h2>
        <button
          aria-label="Close game chat"
          className="grid size-8 place-items-center rounded-md text-xl leading-none text-[#1f2b24] transition hover:bg-[#eef4ed] focus-visible:ring-2 focus-visible:ring-[#2f7d61] focus-visible:outline-none"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </header>
      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length > 0 ? (
          messages.map((item) => {
            const isOwnMessage = String(item.user.id) === String(currentUserId)
            return (
              <li
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                key={item.id}
              >
                <div
                  className={`max-w-[78%] rounded-md px-4 py-2 text-sm ${
                    isOwnMessage
                      ? 'bg-[#2f7d61] text-white'
                      : 'bg-[#D9E7E0] text-[#1f2b24]'
                  }`}
                >
                  <p className="font-semibold">{item.user.username}</p>
                  <p className="mt-1 break-words">{item.message}</p>
                </div>
              </li>
            )
          })
        ) : (
          <li className="rounded-md border border-dashed border-[#cbd5c5] px-4 py-6 text-center text-sm font-medium text-[#617267]">
            No messages yet
          </li>
        )}
      </ul>
      <form
        className="border-t border-[#e1e6de] bg-white p-4"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="game-chat-message">
          Message
        </label>
        <input
          className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
          id="game-chat-message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message..."
          value={message}
        />
        <button
          className="mt-2 w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#9caf9f]"
          disabled={!message.trim()}
          type="submit"
        >
          Send message
        </button>
      </form>
    </section>
  )
}

export default GameChatPanel
