import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import MarkAllReadButton from '@/components/MarkAllReadButton'
import NewMessage from '@/components/NewMessage'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import { formatMessageTime } from '@/utils/formatMessageTime'
import getConversationPath from '@/utils/conversationPath'
import useDirectMessageStore from '@/stores/useDirectMessageStore'

const MenuButton = ({ count, isOpen, onClick }) => (
  <button
    aria-label="Direct messages"
    aria-expanded={isOpen}
    aria-haspopup="menu"
    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none motion-safe:active:scale-95 ${
      isOpen ? 'bg-[#ffbf80]' : ''
    }`}
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
  const markAllRead = useDirectMessageStore((state) => state.markAllRead)

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
    navigate(getConversationPath(conversationId))
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
          className="fixed inset-x-4 top-16 z-40 w-auto overflow-hidden rounded-lg border border-[#e6c9a8] bg-white shadow-[0_20px_50px_rgba(61,18,0,0.18)] sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-3 sm:w-[min(360px,calc(100vw-2rem))]"
        >
          <div className="border-b border-[#f0d9bd] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#3d1200]">
                  Direct messages
                </h2>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-[#e23f32] px-2 py-0.5 text-xs font-black text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                <MarkAllReadButton
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                />
                <NewMessage size="sm" onClick={() => setIsOpen(false)} />
              </div>
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

            {visibleConversations.map((conversation) => {
              const identity = getPlayerIdentity(conversation.friend)

              return (
                <button
                  key={conversation.id}
                  role="menuitem"
                  type="button"
                  className="flex w-full gap-3 px-5 py-3 text-left transition hover:bg-[#fff4e8] focus:bg-[#fff4e8] focus:outline-none"
                  onClick={() => openConversation(conversation.id)}
                >
                  <Avatar
                    alt={identity.name}
                    initials={identity.initials}
                    size={42}
                    src={identity.avatarUrl}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="truncate text-sm font-black text-[#3d1200]">
                        {identity.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold text-[#9a7050]">
                        {formatMessageTime(
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
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MailMenu
