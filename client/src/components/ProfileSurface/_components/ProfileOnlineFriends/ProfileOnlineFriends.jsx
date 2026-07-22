import ProfileLink from '@/components/ProfileLink'

const ProfileOnlineFriends = ({ friends = [], onShowFriends }) => {
  const onlineFriends = friends.filter(({ user }) => user.isOnline)
  const visibleFriends = onlineFriends.slice(0, 4)
  const overflow = Math.max(onlineFriends.length - visibleFriends.length, 0)

  return (
    <section className="bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
          Online Friends
        </h2>
        <span className="text-xs font-bold text-green-600">
          {onlineFriends.length} online
        </span>
      </div>

      {visibleFriends.length === 0 ? (
        <p className="text-sm text-[#7a3810]">No friends online.</p>
      ) : (
        <div className="space-y-2.5">
          {visibleFriends.map(({ user }) => (
            <ProfileLink
              key={user.id}
              className="flex items-center gap-2 transition hover:opacity-75"
              username={user.username}
            >
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#FFB04F] text-[10px] font-bold text-white">
                {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full border border-white bg-green-500" />
              </span>
              <span className="min-w-0 truncate text-sm text-[#3d1200]">
                {user.displayName || user.username}
              </span>
            </ProfileLink>
          ))}
        </div>
      )}

      {overflow > 0 && (
        <button
          className="mt-3 w-full border-t border-[#fceee0] pt-3 text-center text-xs font-semibold text-[#e86d2f] transition hover:opacity-80 focus:ring-2 focus:ring-[#e86d2f]/30 focus:outline-none"
          type="button"
          onClick={onShowFriends}
        >
          +{overflow} more - See all friends
        </button>
      )}
    </section>
  )
}

export default ProfileOnlineFriends
