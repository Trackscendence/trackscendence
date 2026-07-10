import { useEffect, useRef, useState } from 'react'
import { Bell, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import MarkAllReadButton from '@/components/MarkAllReadButton'
import useSocialNotificationStore from '@/stores/useSocialNotificationStore'

const getName = (user) => user?.displayName || user?.username || 'Player'

const getNotificationText = (notification) => {
  const name = getName(notification.actor)

  if (notification.type === 'FRIEND_REQUEST') {
    return `${name} sent a friend request`
  }

  if (notification.type === 'FRIEND_ACCEPTED') {
    return `${name} accepted your friend request`
  }

  if (notification.type === 'DIRECT_MESSAGE') {
    return `${name} sent a message`
  }

  return 'New notification'
}

const formatTime = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const EmptyState = () => (
  <div className="px-5 py-10 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4e8] text-[#9a7050]">
      <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
    </div>
    <p className="mt-4 text-sm font-black text-[#3d1200]">
      You are all caught up
    </p>
    <p className="mt-1 text-xs leading-5 text-[#9a7050]">
      Friend requests and message alerts will appear here.
    </p>
  </div>
)

const SocialNotificationMenu = () => {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const acceptFriendRequest = useSocialNotificationStore(
    (state) => state.acceptFriendRequest,
  )
  const isLoading = useSocialNotificationStore((state) => state.isLoading)
  const isSubmitting = useSocialNotificationStore((state) => state.isSubmitting)
  const loadNotifications = useSocialNotificationStore(
    (state) => state.loadNotifications,
  )
  const markAllRead = useSocialNotificationStore((state) => state.markAllRead)
  const markRead = useSocialNotificationStore((state) => state.markRead)
  const notifications = useSocialNotificationStore(
    (state) => state.notifications,
  )
  const unreadCount = useSocialNotificationStore((state) => state.unreadCount)

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

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

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification.id)
    }

    if (notification.conversationId) {
      setIsOpen(false)
      navigate(
        `/messages?conversation=${encodeURIComponent(
          notification.conversationId,
        )}`,
      )
    }
  }

  const acceptRequest = async (event, notification) => {
    event.stopPropagation()
    const result = await acceptFriendRequest(notification.actor?.id)

    if (result?.conversationId) {
      setIsOpen(false)
      navigate(
        `/messages?conversation=${encodeURIComponent(result.conversationId)}`,
      )
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none motion-safe:active:scale-95 ${
          isOpen ? 'bg-[#ffbf80]' : ''
        }`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e23f32] px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-3 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#e6c9a8] bg-white shadow-[0_20px_50px_rgba(61,18,0,0.18)]"
        >
          <div className="flex items-center justify-between border-b border-[#f0d9bd] px-5 py-4">
            <div>
              <h2 className="text-base font-black text-[#3d1200]">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-[#9a7050]">
                {unreadCount > 0 ? `${unreadCount} unread` : 'No unread alerts'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <MarkAllReadButton
                onClick={markAllRead}
                disabled={unreadCount === 0}
              />
              <Link
                aria-label="Notification settings"
                to="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#fff4e8] focus:ring-2 focus:ring-[#3d1200]/20 focus:outline-none"
                onClick={() => setIsOpen(false)}
              >
                <Settings aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto py-2">
            {isLoading ? (
              <p className="px-5 py-8 text-center text-sm font-semibold text-[#9a7050]">
                Loading notifications
              </p>
            ) : null}

            {!isLoading && notifications.length === 0 ? <EmptyState /> : null}

            {notifications.map((notification) => {
              return (
                <div
                  key={notification.id}
                  role="menuitem"
                  className="flex w-full gap-3 px-5 py-3 text-left transition focus-within:bg-[#fff4e8] hover:bg-[#fff4e8]"
                >
                  <Avatar
                    alt={getName(notification.actor)}
                    initials={getName(notification.actor).slice(0, 2)}
                    size={42}
                    src={notification.actor?.avatarUrl || undefined}
                  />
                  <span className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="w-full text-left focus:outline-none"
                      onClick={() => openNotification(notification)}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm font-black text-[#3d1200]">
                          {getNotificationText(notification)}
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-[#9a7050]">
                          {formatTime(notification.createdAt)}
                        </span>
                      </span>
                      {notification.message ? (
                        <span className="mt-0.5 block truncate text-xs text-[#7a3810]">
                          {notification.message}
                        </span>
                      ) : null}
                    </button>
                    {notification.type === 'FRIEND_REQUEST' &&
                    notification.friendRequestStatus === 'PENDING' &&
                    notification.actor?.id ? (
                      <span className="mt-3 flex gap-2">
                        <button
                          className="rounded-md bg-[#e86d2f] px-3 py-1.5 text-xs font-black text-white"
                          type="button"
                          onClick={(event) =>
                            acceptRequest(event, notification)
                          }
                        >
                          {isSubmitting ? 'Accepting' : 'Accept'}
                        </button>
                      </span>
                    ) : null}
                  </span>
                  {!notification.isRead ? (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e23f32]" />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SocialNotificationMenu
