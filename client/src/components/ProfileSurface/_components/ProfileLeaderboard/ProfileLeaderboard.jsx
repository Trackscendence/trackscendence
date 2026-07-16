import { Link } from 'react-router-dom'
import LeaderboardTable from '@/components/LeaderboardTable'

const getRows = ({ leaderboard = [], profile }) => {
  const rows = leaderboard.slice(0, 5)
  const hasProfile = rows.some((entry) => entry.username === profile.username)

  if (hasProfile || !profile.stats?.rank) {
    return rows
  }

  return [
    ...rows.slice(0, 4),
    {
      rank: profile.stats.rank,
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      totalWins: profile.stats.wins || 0,
    },
  ]
}

const ProfileLeaderboard = ({ leaderboard = [], profile }) => {
  const rows = getRows({ leaderboard, profile })

  return (
    <section className="bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
          Leaderboard
        </p>
        <Link
          aria-label="View full leaderboard"
          className="bg-[#ffd099] px-3 py-2 text-[10px] font-bold tracking-wide text-[#3d1200] uppercase transition hover:bg-[#f2652a] hover:text-white focus:ring-2 focus:ring-[#f2652a]/35 focus:outline-none sm:py-1"
          to="/leaderboard"
        >
          More
        </Link>
      </div>

      <LeaderboardTable rows={rows} currentUserId={profile.id} />
    </section>
  )
}

export default ProfileLeaderboard
