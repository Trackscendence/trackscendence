import { Link } from 'react-router-dom'
import WinRateRing from '../WinRateRing'
import profileFormatters from '../../_utils/profileFormatters'

const ProfileSidebar = ({ friends, isOwnProfile, profile }) => {
  const stats = profile.stats || {}
  const visibleFriends = isOwnProfile ? friends.slice(0, 4) : []

  return (
    <aside className="space-y-5 bg-[#ffd099] p-6 lg:w-[358px] lg:shrink-0">
      <section className="bg-white p-4 text-center">
        <p className="mb-3 text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
          Win Rate
        </p>
        <WinRateRing rate={profileFormatters.getWinRate(stats)} />
        <p className="mt-2 text-xs text-[#7a3810]">
          {stats.wins || 0} wins from {stats.gamesPlayed || 0} games
        </p>
      </section>

      <section className="bg-white p-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
          Profile
        </p>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#7a3810]">Rank</dt>
            <dd className="font-semibold text-[#3d1200]">
              {profileFormatters.formatRank(stats.rank)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#7a3810]">Joined</dt>
            <dd className="font-semibold text-[#3d1200]">
              {profileFormatters.formatDate(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      {isOwnProfile && (
        <section className="bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
              Friends
            </h2>
            <span className="text-xs font-semibold text-[#7a3810]">
              {friends.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {visibleFriends.map(({ user }) => (
              <Link
                key={user.id}
                className="flex items-center gap-2 transition hover:opacity-75"
                to={`/users/${user.username}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFB04F] text-[10px] font-bold text-white">
                  {(user.displayName || user.username)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0 truncate text-sm text-[#3d1200]">
                  {user.displayName || user.username}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}

export default ProfileSidebar
