import { useEffect, useRef } from 'react'
import { socket } from '@/services/socket'
import useChatStore from '@/stores/useChatStore'
import useAuthStore from '@/stores/useAuthStore'

const Room = () => {
  const messageRef = useRef()
  const activeRoom = useChatStore((state) => state.activeRoom)
  const messages = useChatStore((state) => state.messages[activeRoom])
  const addMessage = useChatStore((state) => state.addMessage)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const handleMessage = (data) => {
      const message = {
        id: Date.now(),
        message: data.message,
        user: data.user,
      }

      const room = data.recipient
      addMessage(room, message)
    }

    const handlePrivateMessage = (data) => {
      const message = {
        id: Date.now(),
        message: data.message,
        user: data.user,
      }

      const room =
        user.id === data.user.id ? data.recipient : `user:${data.user.id}`
      addMessage(room, message)
    }

    socket.on('chat:message', handleMessage)
    socket.on('chat:private_message', handlePrivateMessage)

    return () => {
      socket.off('chat:message', handleMessage)
      socket.off('chat:private_message', handlePrivateMessage)
    }
  }, [user.id, addMessage])

  const sendMessage = () => {
    const recipient = useChatStore.getState().activeRoom
    const event = recipient.startsWith('user:')
      ? 'chat:private_message'
      : 'chat:message'
    const text = messageRef.current.value.trim()

    if (!text) {
      return
    }

    const message = {
      recipient: recipient,
      message: text,
    }

    socket.emit(event, message)
    messageRef.current.value = ''
  }

  return (
    <div>
      <ul className="flex-column border-b border-[#e1e6de] bg-[#fbfcfa] p-4">
        {messages.map((m) => (
          <li
            className={
              user.id === m.user.id
                ? 'mt-2 w-full place-self-end rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm inline-2/3'
                : 'mt-2 w-full place-self-start rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm inline-2/3'
            }
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
