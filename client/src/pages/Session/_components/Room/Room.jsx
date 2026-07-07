import { useState } from 'react'

const Room = ({ currentUserId, messages, onSendMessage, room }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (onSendMessage(message)) {
      setMessage('')
    }
  }

  return (
    <section className="flex min-h-[28rem] flex-col bg-[#fbfcfa]">
      <header className="border-b border-[#e1e6de] px-4 py-3">
        <h2 className="text-base font-semibold text-[#1f2b24]">
          {room?.name || '# General'}
        </h2>
      </header>
      <ul className="flex-1 space-y-3 overflow-y-auto p-4">
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
        <label className="sr-only" htmlFor="chat-message">
          Message
        </label>
        <input
          className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
          id="chat-message"
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

export default Room
