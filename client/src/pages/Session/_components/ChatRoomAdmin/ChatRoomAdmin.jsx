import { useState } from 'react'

const ChatRoomAdmin = ({
  currentUserId,
  isSubmitting,
  members,
  onInviteUser,
  onRemoveMember,
  onSetMuted,
}) => {
  const [targetUserId, setTargetUserId] = useState('')
  const parsedTargetUserId = Number(targetUserId)
  const canInvite =
    Number.isInteger(parsedTargetUserId) && parsedTargetUserId > 0

  const handleInvite = async (event) => {
    event.preventDefault()
    if (!canInvite) return

    const result = await onInviteUser(parsedTargetUserId)
    if (result) {
      setTargetUserId('')
    }
  }

  return (
    <div className="border-t border-[#e1e6de] bg-white px-4 py-3">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleInvite}>
        <label className="sr-only" htmlFor="chat-room-invite-user">
          User ID
        </label>
        <input
          className="min-w-0 flex-1 rounded-md border border-[#cbd5c5] px-3 py-2 text-sm outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
          id="chat-room-invite-user"
          inputMode="numeric"
          onChange={(event) => setTargetUserId(event.target.value)}
          placeholder="User ID"
          value={targetUserId}
        />
        <button
          className="w-full rounded-md bg-[#2f7d61] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#9caf9f] sm:w-auto"
          disabled={isSubmitting || !canInvite}
          type="submit"
        >
          Invite
        </button>
      </form>
      <ul className="mt-3 space-y-2">
        {members.map((member) => {
          const isCurrentUser = String(member.user.id) === String(currentUserId)
          const isAdmin = member.role === 'ADMIN'
          const canModerate = !isCurrentUser && !isAdmin

          return (
            <li
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#e1e6de] bg-[#fbfcfa] px-3 py-2 text-sm"
              key={member.user.id}
            >
              <div>
                <p className="font-semibold text-[#1f2b24]">
                  {member.user.displayName || member.user.username}
                </p>
                <p className="text-xs font-medium text-[#617267]">
                  {member.status.toLowerCase()} - {member.role.toLowerCase()}
                  {member.isMuted ? ' - muted' : ''}
                </p>
              </div>
              {canModerate ? (
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-[#cbd5c5] px-2 py-1 text-xs font-semibold text-[#1f2b24] transition hover:border-[#2f7d61]"
                    disabled={isSubmitting}
                    onClick={() =>
                      onSetMuted({
                        isMuted: !member.isMuted,
                        targetUserId: member.user.id,
                      })
                    }
                    type="button"
                  >
                    {member.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    className="rounded-md border border-[#d9aaa2] px-2 py-1 text-xs font-semibold text-[#9d3022] transition hover:border-[#9d3022]"
                    disabled={isSubmitting}
                    onClick={() => onRemoveMember(member.user.id)}
                    type="button"
                  >
                    Kick
                  </button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ChatRoomAdmin
