import { useState } from 'react'
import ChatRoomAdmin from '../ChatRoomAdmin'

const Room = ({
  currentUserId,
  isSubmittingRoom,
  messages,
  onInviteUser,
  onJoinRoom,
  onRemoveMember,
  onSendMessage,
  onSetMuted,
  room,
}) => {
  const [message, setMessage] = useState('')
  const isChatRoom = room?.type === 'chat'
  const isJoinedChatRoom = !isChatRoom || room?.isJoined
  const isMuted = Boolean(room?.membership?.isMuted)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (onSendMessage(message)) {
      setMessage('')
    }
  }

  return (
    <section className="flex min-h-[28rem] flex-col bg-[#fbfcfa]">
      <header className="border-b border-[#e1e6de] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1f2b24]">
              {room?.name || '# General'}
            </h2>
            {isChatRoom ? (
              <p className="mt-1 text-xs font-semibold text-[#617267]">
                {room.visibility === 'INVITE_ONLY' ? 'Invite-only' : 'Public'}
                {room.isInvited ? ' - invited' : ''}
                {isMuted ? ' - muted' : ''}
              </p>
            ) : null}
          </div>
          {isChatRoom && !room.isJoined ? (
            <button
              className="rounded-md bg-[#2f7d61] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#9caf9f]"
              disabled={isSubmittingRoom}
              onClick={() => onJoinRoom(room)}
              type="button"
            >
              Join
            </button>
          ) : null}
        </div>
      </header>
      {room?.isAdmin ? (
        <ChatRoomAdmin
          currentUserId={currentUserId}
          isSubmitting={isSubmittingRoom}
          members={room.members}
          onInviteUser={(targetUserId) => onInviteUser({ room, targetUserId })}
          onRemoveMember={(targetUserId) =>
            onRemoveMember({ room, targetUserId })
          }
          onSetMuted={({ isMuted: nextIsMuted, targetUserId }) =>
            onSetMuted({ isMuted: nextIsMuted, room, targetUserId })
          }
        />
      ) : null}
      <ul className="flex-1 space-y-3 overflow-y-auto p-4">
        {!isJoinedChatRoom ? (
          <li className="rounded-md border border-dashed border-[#cbd5c5] px-4 py-6 text-center text-sm font-medium text-[#617267]">
            Join this room to read and send messages
          </li>
        ) : messages.length > 0 ? (
          messages.map((item) => {
            const isOwnMessage = String(item.user.id) === String(currentUserId)
            return (
              <li
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                key={item.id}
              >
                <div
                  className={`max-w-[78%] rounded-md px-4 py-2 text-sm ${
                    isOwnMessage
                      ? 'bg-[#2f7d61] text-white'
                      : 'bg-[#D9E7E0] text-[#1f2b24]'
                  }`}
                >
                  <p className="font-semibold">{item.user.username}</p>
                  <p className="mt-1 break-words">{item.message}</p>
                </div>
              </li>
            )
          })
        ) : (
          <li className="rounded-md border border-dashed border-[#cbd5c5] px-4 py-6 text-center text-sm font-medium text-[#617267]">
            No messages yet
          </li>
        )}
      </ul>
      {isJoinedChatRoom ? (
        <form
          className="border-t border-[#e1e6de] bg-white p-4"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="chat-message">
            Message
          </label>
          <input
            className="w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20 disabled:cursor-not-allowed disabled:bg-[#edf2ea]"
            disabled={isMuted}
            id="chat-message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isMuted ? 'Muted in this room' : 'Message...'}
            value={message}
          />
          <button
            className="mt-2 w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#9caf9f]"
            disabled={isMuted || !message.trim()}
            type="submit"
          >
            Send message
          </button>
        </form>
      ) : null}
    </section>
  )
}

export default Room
