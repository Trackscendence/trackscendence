import emojiIcon from '@/assets/game/chat-emoji.svg'
import imageIcon from '@/assets/game/chat-image.svg'
import sendIcon from '@/assets/game/chat-send.svg'
import stacksIcon from '@/assets/game/chat-stacks.svg'

// The pink composer at the foot of the chat panel: a decorative tool row
// (emoji / image / attachments have no backend yet, so they are presentation
// only and hidden from assistive tech) above the message field and send button.
const ChatComposer = ({ onChange, onSubmit, value }) => {
  return (
    <div className="border-t border-black/60 bg-[#F1BABA] px-4 pt-3 pb-4">
      <div aria-hidden="true" className="mb-3 flex items-center gap-4">
        <img alt="" className="size-[18px]" src={emojiIcon} />
        <img alt="" className="size-[22px]" src={imageIcon} />
        <img alt="" className="size-5" src={stacksIcon} />
      </div>
      <form className="flex items-stretch" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="game-chat-message">
          Message
        </label>
        <input
          autoComplete="off"
          className="min-w-0 flex-1 rounded-l-xl bg-[#FFE3C1] px-4 py-5 text-black placeholder:text-black/40 focus-visible:outline-none"
          id="game-chat-message"
          onChange={onChange}
          placeholder="Message..."
          value={value}
        />
        <button
          aria-label="Send message"
          className="grid w-14 place-items-center rounded-r-xl border border-l-0 border-[#7C7B7B] bg-[#FFD5A2] transition hover:bg-[#f8c98d] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!value.trim()}
          type="submit"
        >
          <img alt="" className="size-6" src={sendIcon} />
        </button>
      </form>
    </div>
  )
}

export default ChatComposer
