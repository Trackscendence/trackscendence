import chatPanelIcon from '@/assets/game/chat-panel.svg'

const ChatPanelButton = ({ disabled = false, isOpen = false, onClick }) => {
  return (
    <button
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Close game chat' : 'Open game chat'}
      className="focus-visible:ring-offset-surface-warm absolute right-3 bottom-16 z-20 size-11 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 sm:right-5 sm:bottom-20 sm:size-[45px]"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <img alt="" className="size-full" src={chatPanelIcon} />
    </button>
  )
}

export default ChatPanelButton
