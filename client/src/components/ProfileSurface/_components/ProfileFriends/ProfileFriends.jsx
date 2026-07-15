import ProfileLink from '@/components/ProfileLink'
import EmptyState from '../EmptyState'

const ProfileFriends = ({ friends, isOwnProfile }) => {
  if (!isOwnProfile) {
    return (
      <EmptyState title="Friends are private">
        Public friend lists are not exposed on profiles yet.
      </EmptyState>
    )
  }

  if (!friends || friends.length === 0) {
    return (
      <EmptyState title="No friends yet">
        Accepted friends will appear here after requests are approved.
      </EmptyState>
    )
  }

  return (
    <section className="bg-white">
      <div className="border-b border-[#fceee0] px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold tracking-wide text-[#3d1200] uppercase">
          Friends ({friends.length})
        </h2>
      </div>
      <div className="divide-y divide-[#fceee0]">
        {friends.map(({ friendSince, user }) => (
          <ProfileLink
            key={user.id}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#fff8f2] sm:px-5"
            username={user.username}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFB04F] text-xs font-bold text-white">
              {(user.displayName || user.username).slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#3d1200]">
                {user.displayName || user.username}
              </span>
              <span className="text-xs text-[#7a3810]">
                Friends since {new Date(friendSince).toLocaleDateString()}
              </span>
            </span>
          </ProfileLink>
        ))}
      </div>
    </section>
  )
}

export default ProfileFriends
