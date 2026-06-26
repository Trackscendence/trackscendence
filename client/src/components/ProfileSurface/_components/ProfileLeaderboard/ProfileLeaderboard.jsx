const formatNumber = (value) => {
  return new Intl.NumberFormat('en').format(value || 0)
}

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
      <p className="mb-3 text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
        Leaderboard
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-[#7a3810]">No ranked players yet.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((entry) => {
            const isCurrentProfile = entry.username === profile.username

            return (
              <div
                key={`${entry.rank}-${entry.username}`}
                className={`flex items-center gap-2.5 px-2 py-1.5 text-sm ${
                  isCurrentProfile ? 'bg-[#ffd099]' : ''
                }`}
              >
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-[#7a3810]">
                  {entry.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-[#3d1200]">
                  {entry.displayName || entry.username}
                </span>
                <span className="shrink-0 font-semibold text-[#7a3810]">
                  {formatNumber(entry.totalWins)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ProfileLeaderboard
