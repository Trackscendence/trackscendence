import Avatar from '@/components/Avatar'
import ProfileLink from '@/components/ProfileLink'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import { formatMessageTime } from '@/utils/formatMessageTime'
import MessageComposer from '../MessageComposer'
import BlockedBanner from './_components/BlockedBanner'
import ThreadHeaderMenu from './_components/ThreadHeaderMenu'

const EmptyThread = () => (
  <div className="flex flex-1 items-center justify-center px-6 text-center">
    <div>
      <p className="text-lg font-black text-[#3d1200]">Select a conversation</p>
      <p className="mt-1 text-sm text-[#9a7050]">
        Friend messages open in this space.
      </p>
    </div>
  </div>
)

const MessageThread = ({
  conversation,
  currentUserId,
  isConnected,
  isLoading,
  messages,
  onBlock,
  onSend,
  onUnblock,
}) => {
  if (!conversation) return <EmptyThread />

  const friend = getPlayerIdentity(conversation.friend)
  const blockState = conversation.blockState || 'none'
  const isBlocked = blockState !== 'none'

  return (
    <section className="flex min-h-0 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-[#f0d9bd] px-5 py-4">
        <ProfileLink
          aria-label={`View ${friend.name}'s profile`}
          className="flex min-w-0 items-center gap-3 rounded-md transition hover:bg-[#fff4e8] focus:ring-2 focus:ring-[#3d1200]/20 focus:outline-none"
          username={conversation.friend?.username}
        >
          <Avatar
            alt={friend.name}
            initials={friend.initials}
            size={44}
            src={friend.avatarUrl}
          />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-[#3d1200]">
              {friend.name}
            </h2>
            <p className="text-xs font-semibold text-[#9a7050]">
              {isConnected ? 'Online' : 'Reconnecting'}
            </p>
          </div>
        </ProfileLink>

        <ThreadHeaderMenu
          blockState={blockState}
          friendName={friend.name}
          onBlock={onBlock}
          onUnblock={onUnblock}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#fff7ed] px-5 py-5">
        {isLoading ? (
          <p className="text-center text-sm font-semibold text-[#9a7050]">
            Loading messages
          </p>
        ) : null}

        {!isLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-black text-[#3d1200]">
                No messages yet
              </p>
              <p className="mt-1 text-xs text-[#9a7050]">
                Send the first one when you are ready.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const isOwn = String(message.senderId) === String(currentUserId)

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-[#e86d2f] text-white'
                      : 'border border-[#f0d9bd] bg-white text-[#3d1200]'
                  }`}
                >
                  <p className="text-sm leading-6 break-words">
                    {message.message}
                  </p>
                  <p
                    className={`mt-1 text-right text-[10px] font-semibold ${
                      isOwn ? 'text-white/70' : 'text-[#9a7050]'
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* A blocked conversation stays readable, but sending is closed off: the
          banner replaces the composer so there is no disabled input to fight
          with. Keyed per conversation, the composer remounts on switch so the
          draft never leaks across chats and the cursor lands in the input. */}
      {isBlocked ? (
        <BlockedBanner
          blockState={blockState}
          friendName={friend.name}
          onUnblock={onUnblock}
        />
      ) : (
        <MessageComposer
          key={conversation.id}
          autoFocus
          disabled={!conversation}
          onSend={onSend}
        />
      )}
    </section>
  )
}

export default MessageThread
