import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

const TYPING_IDLE_TIMEOUT_MS = 3000

// The one composer both entry points land on (a notification row and the
// profile mailbox both navigate here). It takes focus on mount and the thread
// remounts it per conversation, so arriving in a chat puts the cursor in the
// input; Enter sends, Shift+Enter keeps making new lines.
const MessageComposer = ({
  autoFocus = false,
  disabled,
  onSend,
  onStopTyping,
  onTyping,
}) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const idleTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)
  const onStopTypingRef = useRef(onStopTyping)
  const onTypingRef = useRef(onTyping)
  const remaining = 500 - message.length

  useEffect(() => {
    onTypingRef.current = onTyping
  }, [onTyping])

  useEffect(() => {
    onStopTypingRef.current = onStopTyping
  }, [onStopTyping])

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current != null) {
        clearTimeout(idleTimeoutRef.current)
      }
      if (isTypingRef.current) onStopTypingRef.current?.()
    }
  }, [])

  const stopTyping = () => {
    if (idleTimeoutRef.current != null) clearTimeout(idleTimeoutRef.current)
    idleTimeoutRef.current = null

    if (!isTypingRef.current) return

    isTypingRef.current = false
    onStopTypingRef.current?.()
  }

  const scheduleIdleStop = () => {
    if (idleTimeoutRef.current != null) clearTimeout(idleTimeoutRef.current)
    idleTimeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_TIMEOUT_MS)
  }

  const startTyping = () => {
    if (!onTypingRef.current) return

    isTypingRef.current = true
    onTypingRef.current()
    scheduleIdleStop()
  }

  const send = () => {
    const text = message.trim()
    if (!text || disabled || isSending) return

    stopTyping()

    // Thread sends answer synchronously (socket emit), compose sends resolve
    // later (the conversation is created first). Only a confirmed send clears
    // the draft, so a failure or rejection never eats the message; while one
    // async send is pending, further submits are ignored so the same text
    // cannot be delivered twice.
    const result = onSend(text)
    if (result === true) {
      setMessage('')
      return
    }
    if (typeof result?.then === 'function') {
      setIsSending(true)
      result
        .then((sent) => {
          if (sent) setMessage('')
        })
        .catch(() => {
          // The caller surfaces its own failure (toast); the draft stays.
        })
        .finally(() => setIsSending(false))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    send()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const handleChange = (event) => {
    const nextMessage = event.target.value
    setMessage(nextMessage)

    if (nextMessage.trim()) {
      startTyping()
    } else {
      stopTyping()
    }
  }

  return (
    <form
      className="border-t border-[#f0d9bd] bg-white px-4 py-4 sm:px-5"
      onSubmit={handleSubmit}
    >
      <div className="flex items-end gap-2 sm:gap-3">
        <label className="sr-only" htmlFor="direct-message">
          Message
        </label>
        <textarea
          autoFocus={autoFocus}
          id="direct-message"
          value={message}
          maxLength={500}
          rows={2}
          disabled={disabled}
          placeholder="Message"
          className="min-h-11 flex-1 resize-none rounded-md border border-[#e6c9a8] bg-[#fffaf3] px-3 py-2 text-sm text-[#3d1200] transition outline-none placeholder:text-[#9a7050] focus:border-[#e86d2f] disabled:cursor-not-allowed disabled:bg-[#f5eadc]"
          onBlur={stopTyping}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          aria-label="Send message"
          type="submit"
          disabled={disabled || isSending || !message.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e86d2f] text-white transition hover:bg-[#c95b24] disabled:cursor-not-allowed disabled:bg-[#d8b49a]"
        >
          <Send aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-right text-[11px] font-semibold text-[#9a7050]">
        {remaining}
      </p>
    </form>
  )
}

export default MessageComposer
