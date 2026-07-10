import { useState } from 'react'
import { Send } from 'lucide-react'

const MessageComposer = ({ disabled, onSend }) => {
  const [message, setMessage] = useState('')
  const remaining = 500 - message.length

  const submit = (event) => {
    event.preventDefault()
    const text = message.trim()
    if (!text || disabled) return
    if (onSend(text)) setMessage('')
  }

  return (
    <form
      className="border-t border-[#f0d9bd] bg-white px-5 py-4"
      onSubmit={submit}
    >
      <div className="flex items-end gap-3">
        <label className="sr-only" htmlFor="direct-message">
          Message
        </label>
        <textarea
          id="direct-message"
          value={message}
          maxLength={500}
          rows={2}
          disabled={disabled}
          placeholder="Message"
          className="min-h-11 flex-1 resize-none rounded-md border border-[#e6c9a8] bg-[#fffaf3] px-3 py-2 text-sm text-[#3d1200] transition outline-none placeholder:text-[#9a7050] focus:border-[#e86d2f] disabled:cursor-not-allowed disabled:bg-[#f5eadc]"
          onChange={(event) => setMessage(event.target.value)}
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
