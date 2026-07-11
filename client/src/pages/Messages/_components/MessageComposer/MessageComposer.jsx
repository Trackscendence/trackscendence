import { useState } from 'react'
import { Send } from 'lucide-react'

// The one composer both entry points land on (a notification row and the
// profile mailbox both navigate here). It takes focus on mount and the thread
// remounts it per conversation, so arriving in a chat puts the cursor in the
// input; Enter sends, Shift+Enter keeps making new lines.
const MessageComposer = ({ autoFocus = false, disabled, onSend }) => {
  const [message, setMessage] = useState('')
  const remaining = 500 - message.length

  const send = () => {
    const text = message.trim()
    if (!text || disabled) return

    // Thread sends answer synchronously (socket emit), compose sends resolve
    // later (the conversation is created first). Only a confirmed send clears
    // the draft, so a failure never eats the message.
    const result = onSend(text)
    if (result === true) {
      setMessage('')
    } else if (typeof result?.then === 'function') {
      result.then((sent) => {
        if (sent) setMessage('')
      })
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

  return (
    <form
      className="border-t border-[#f0d9bd] bg-white px-5 py-4"
      onSubmit={handleSubmit}
    >
      <div className="flex items-end gap-3">
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
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          aria-label="Send message"
          type="submit"
          disabled={disabled || !message.trim()}
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
