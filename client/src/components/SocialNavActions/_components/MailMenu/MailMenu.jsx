import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import useDirectMessageStore from '@/stores/useDirectMessageStore'

const formatTime = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const getName = (user) => user?.displayName || user?.username || 'Player'

const MenuButton = ({ count, isOpen, onClick }) => (
  <button
    aria-label="Direct messages"
    aria-expanded={isOpen}
    aria-haspopup="menu"
    className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#ffb04f] text-[#3d1200] shadow-[0_7px_14px_rgba(122,56,16,0.18)] transition hover:bg-[#ffa238] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none"
    type="button"
    onClick={onClick}
  >
    <Mail aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
    {count > 0 ? (
      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e23f32] px-1 text-[10px] font-black text-white">
        {count > 9 ? '9+' : count}
      </span>
    ) : null}
  </button>
)

const EmptyState = ({ mode }) => (
  <div className="px-5 py-10 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4e8] text-[#9a7050]">
      <Mail aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
    </div>
    <p className="mt-4 text-sm font-black text-[#3d1200]">
      {mode === 'unread' ? 'No unread messages' : 'No messages'}
    </p>
    <p className="mt-1 text-xs leading-5 text-[#9a7050]">
      Friend conversations will appear here.
    </p>
  </div>
)

const MailMenu = () => {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('all')
  const conversations = useDirectMessageStore((state) => state.conversations)
  const isLoading = useDirectMessageStore(
    (state) => state.isLoadingConversations,
  )
  const unreadCount = useDirectMessageStore((state) => state.unreadCount)
  const loadConversations = useDirectMessageStore(
    (state) => state.loadConversations,
  )

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const visibleConversations =
    mode === 'unread'
      ? conversations.filter((conversation) => conversation.unreadCount > 0)
      : conversations

  const openConversation = (conversationId) => {
    setIsOpen(false)
    navigate(`/messages?conversation=${encodeURIComponent(conversationId)}`)
  }

  return (
    <div className="relative" ref={menuRef}>
      <MenuButton
        count={unreadCount}
        isOpen={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      />

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#e6c9a8] bg-white shadow-[0_20px_50px_rgba(61,18,0,0.18)]"
        >
          <div className="border-b border-[#f0d9bd] px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#3d1200]">
                Direct messages
              </h2>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-[#e23f32] px-2 py-0.5 text-xs font-black text-white">
                  {unreadCount}
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-2 rounded-md bg-[#fff4e8] p-1">
              {['all', 'unread'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded px-3 py-1.5 text-xs font-black capitalize transition ${
                    mode === item
                      ? 'bg-[#3d1200] text-white'
                      : 'text-[#7a3810] hover:bg-white'
                  }`}
                  onClick={() => setMode(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto py-2">
            {isLoading ? (
              <p className="px-5 py-8 text-center text-sm font-semibold text-[#9a7050]">
                Loading messages
              </p>
            ) : null}

            {!isLoading && visibleConversations.length === 0 ? (
              <EmptyState mode={mode} />
            ) : null}

            {visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                role="menuitem"
                type="button"
                className="flex w-full gap-3 px-5 py-3 text-left transition hover:bg-[#fff4e8] focus:bg-[#fff4e8] focus:outline-none"
                onClick={() => openConversation(conversation.id)}
              >
                <Avatar
                  alt={getName(conversation.friend)}
                  initials={getName(conversation.friend).slice(0, 2)}
                  size={42}
                  src={conversation.friend?.avatarUrl || undefined}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="truncate text-sm font-black text-[#3d1200]">
                      {getName(conversation.friend)}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#9a7050]">
                      {formatTime(
                        conversation.lastMessage?.createdAt ||
                          conversation.updatedAt,
                      )}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#7a3810]">
                    {conversation.lastMessage?.message || 'Start a message'}
                  </span>
                </span>
                {conversation.unreadCount > 0 ? (
                  <span className="mt-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#e23f32] px-1 text-[10px] font-black text-white">
                    {conversation.unreadCount > 9
                      ? '9+'
                      : conversation.unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MailMenu
