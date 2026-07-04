import { useEffect, useRef, useState } from 'react'
import { socket } from '@/services/socket'

const Room = () => {
  const messageRef = useRef()
  const [messages, setMessages] = useState([])

  const handler = (data) => {
    setMessages((previous) => [
      ...previous,
      { id: previous.length, message: data.message, user: data.user },
    ])
  }

  useEffect(() => {
    socket.on('message', handler)
    return () => {
      socket.off('message', handler)
    }
  }, [])

  const sendMessage = () => {
    socket.emit('message', {
      message: messageRef.current.value,
      room: 'channel:#general',
    })
  }

  return (
    <div>
      <ul className="flex-column border-b border-[#e1e6de] bg-[#fbfcfa] p-4">
        {messages.map((m) => (
          <li
            className="mt-2 w-full place-self-end rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm inline-2/3"
            key={m.id}
          >
            <span className="font-semibold">{m.user.username}:</span>{' '}
            {m.message}
          </li>
        ))}
      </ul>
      <div className="border-[#e1e6de] bg-[#fbfcfa] p-4">
        <input
          className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
          id="message"
          placeholder="Message..."
          ref={messageRef}
        />
        <button
          className="mt-2 w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52]"
          onClick={sendMessage}
          type="button"
        >
          Send message
        </button>
      </div>
    </div>
  )
}

export default Room
