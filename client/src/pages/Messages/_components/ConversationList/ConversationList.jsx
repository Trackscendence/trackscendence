import Avatar from '@/components/Avatar'
import ProfileLink from '@/components/ProfileLink'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import { formatMessageDate } from '@/utils/formatMessageTime'

const EmptyState = ({ filter }) => (
  <div className="px-6 py-10 text-center">
    <p className="text-sm font-black text-[#3d1200]">
      {filter === 'unread' ? 'No unread messages' : 'No conversations'}
    </p>
    <p className="mt-1 text-xs leading-5 text-[#9a7050]">
      Accepted friends will appear here.
    </p>
  </div>
)

const ConversationList = ({
  activeConversationId,
  conversations,
  filter,
  isLoading,
  onFilterChange,
  onSelect,
}) => {
  return (
    <aside className="flex min-h-0 flex-col border-r border-[#f0d9bd] bg-[#fffaf3]">
      <div className="border-b border-[#f0d9bd] px-5 py-5">
        <h1 className="text-2xl font-black text-[#3d1200]">Messages</h1>
        <div className="mt-4 grid grid-cols-2 rounded-md bg-[#fff0df] p-1">
          {['all', 'unread'].map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded px-3 py-2 text-xs font-black capitalize transition ${
                filter === item
                  ? 'bg-[#3d1200] text-white'
                  : 'text-[#7a3810] hover:bg-white'
              }`}
              onClick={() => onFilterChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <p className="px-5 py-8 text-center text-sm font-semibold text-[#9a7050]">
            Loading conversations
          </p>
        ) : null}

        {!isLoading && conversations.length === 0 ? (
          <EmptyState filter={filter} />
        ) : null}

        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId
          const identity = getPlayerIdentity(conversation.friend)

          // The avatar links to the friend's profile and the rest of the row
          // selects the conversation. They are sibling interactive elements
          // (a link cannot legally nest inside a button), so both stay
          // keyboard-reachable with their own focus rings.
          return (
            <div
              key={conversation.id}
              className={`flex w-full items-start gap-3 border-l-4 px-4 py-3 transition ${
                isActive
                  ? 'border-[#e86d2f] bg-white'
                  : 'border-transparent hover:bg-white'
              }`}
            >
              <ProfileLink
                aria-label={`View ${identity.name}'s profile`}
                className="shrink-0 rounded-full focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none"
                username={conversation.friend?.username}
              >
                <Avatar
                  alt={identity.name}
                  initials={identity.initials}
                  size={44}
                  src={identity.avatarUrl}
                />
              </ProfileLink>
              <button
                type="button"
                className="flex min-w-0 flex-1 gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d1200]/25"
                onClick={() => onSelect(conversation.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="truncate text-sm font-black text-[#3d1200]">
                      {identity.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#9a7050]">
                      {formatMessageDate(
                        conversation.lastMessage?.createdAt ||
                          conversation.updatedAt,
                      )}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#7a3810]">
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
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default ConversationList
