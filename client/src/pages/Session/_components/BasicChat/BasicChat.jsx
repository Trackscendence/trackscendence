import { useEffect, useRef, useState } from 'react'
import { socket } from '@/services/socket'

const BasicChat = () => {
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
    <>
      <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
        <symbol id="circle-fill" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="4" />
        </symbol>
      </svg>
      <div className="mt-6 rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-[1fr_2fr] rounded-t-md border border-[#e1e6de] bg-[#fbfcfa]">
          <div className="border-e border-[#e1e6de] p-4">
            <ul>
              <li className="mt-2 w-full rounded-md bg-[#58947C] px-4 py-2.5 text-sm font-semibold text-white">
                # General
              </li>
            </ul>
            <h2 className="mt-4 font-semibold">FRIENDS</h2>
            <hr className="border-[#e1e6de]" />
            <ul>
              <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
                <div className="place-self-center">
                  <svg className="size-4 place-self-center fill-green-500">
                    <use href="#circle-fill" />
                  </svg>
                </div>
                <div className="place-self-center">eve123</div>
                <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
                  15
                </div>
              </li>
              <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
                <div className="place-self-center">
                  <svg className="size-4 place-self-center fill-red-500">
                    <use href="#circle-fill" />
                  </svg>
                </div>
                <div className="place-self-center">eve123</div>
                <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
                  15
                </div>
              </li>
              <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
                <div className="place-self-center">
                  <svg className="size-4 place-self-center fill-green-500">
                    <use href="#circle-fill" />
                  </svg>
                </div>
                <div className="place-self-center">eve123</div>
                <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
                  15
                </div>
              </li>
              <li className="mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]">
                <div className="place-self-center">
                  <svg className="size-4 place-self-center fill-green-500">
                    <use href="#circle-fill" />
                  </svg>
                </div>
                <div className="place-self-center">eve123</div>
                <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
                  15
                </div>
              </li>
            </ul>
          </div>
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
        </div>
      </div>
    </>
  )
}

export default BasicChat
