import ProfileLeaderboard from '../ProfileLeaderboard'
import ProfileOnlineFriends from '../ProfileOnlineFriends'
import WinRateRing from '../WinRateRing'
import profileFormatters from '../../_utils/profileFormatters'

const ProfileSidebar = ({ friends, leaderboard, onShowFriends, profile }) => {
  const stats = profile.stats || {}

  return (
    <aside className="space-y-5 bg-[#ffd099] p-4 sm:p-6 lg:w-[358px] lg:shrink-0">
      <ProfileOnlineFriends friends={friends} onShowFriends={onShowFriends} />

      <section className="bg-white p-4 text-center">
        <p className="mb-3 text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
          Win Rate
        </p>
        <WinRateRing rate={profileFormatters.getWinRate(stats)} />
        <p className="mt-2 text-xs text-[#7a3810]">
          {stats.gamesPlayed
            ? `${stats.gamesPlayed} games played`
            : 'No games yet'}
        </p>
      </section>

      <ProfileLeaderboard leaderboard={leaderboard} profile={profile} />
    </aside>
  )
}

export default ProfileSidebar
