const formatWins = (value) => new Intl.NumberFormat('en').format(value || 0)

const RankDelta = ({ delta }) => {
  if (!delta) return null
  const isUp = delta > 0
  return (
    <span
      className={`text-[11px] font-bold ${isUp ? 'text-[#16a34a]' : 'text-[#c2410c]'}`}
    >
      {isUp ? '▲' : '▼'}
      {Math.abs(delta)}
    </span>
  )
}

// Shared ranked-players table. A presenter: it renders whatever rows it is
// given and never reads a store. Used by the profile leaderboard and the
// post-game results snapshot so both read identically. Each row is
// `{ rank, userId, username, displayName, totalWins, delta? }`.
const LeaderboardTable = ({
  rows = [],
  currentUserId,
  showYouBadge = false,
}) => {
  if (rows.length === 0) {
    return <p className="text-sm text-[#7a3810]">No ranked players yet.</p>
  }

  return (
    <div className="space-y-1">
      {rows.map((entry) => {
        const isYou = currentUserId != null && entry.userId === currentUserId

        return (
          <div
            key={`${entry.rank}-${entry.userId ?? entry.username}`}
            className={`flex items-center gap-2.5 px-2 py-1.5 text-sm ${
              isYou ? 'bg-[rgba(255,208,153,0.53)]' : ''
            }`}
          >
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-[#7a3810]">
              {entry.rank}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-[#3d1200]">
              {entry.displayName || entry.username}
            </span>
            {isYou && showYouBadge ? (
              <span className="shrink-0 rounded bg-[#f2652a] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                You
              </span>
            ) : null}
            <RankDelta delta={isYou ? entry.delta : 0} />
            <span className="shrink-0 font-semibold text-[#7a3810]">
              {formatWins(entry.totalWins)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default LeaderboardTable
