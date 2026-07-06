import chatPanelIcon from '@/assets/game/chat-panel.svg'

const ChatPanelButton = () => {
  return (
    <button
      aria-label="Open chat panel"
      className="focus-visible:ring-offset-surface-warm absolute right-5 bottom-5 z-20 size-[45px] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
      type="button"
    >
      <img alt="Open chat panel" className="size-full" src={chatPanelIcon} />
    </button>
  )
}

export default ChatPanelButton
