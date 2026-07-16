import ProfileLink from '@/components/ProfileLink'

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0)

const formatWinRate = (value) => `${Math.round((value || 0) * 100)}%`

const headerCellClassName =
  'px-4 py-3 text-xs font-bold tracking-wide text-[#7a3810] uppercase'

// Full ranking table for the leaderboard page. A presenter: it renders the
// rows it is given and never reads a store. Each row is `{ rank, userId,
// username, displayName, totalWins, totalScore, gamesPlayed, winRate }`.
const LeaderboardRankingTable = ({ rows = [], currentUserId }) => {
  if (rows.length === 0) {
    return (
      <div className="bg-white px-5 py-8 text-sm font-semibold text-[#7a3810]">
        No players match these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#ffd099]">
            <th className={headerCellClassName}>Rank</th>
            <th className={headerCellClassName}>Player</th>
            <th className={`${headerCellClassName} text-right`}>Wins</th>
            <th className={`${headerCellClassName} text-right`}>Score</th>
            <th className={`${headerCellClassName} text-right`}>Games</th>
            <th className={`${headerCellClassName} text-right`}>Win rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const isYou =
              currentUserId != null && entry.userId === currentUserId

            return (
              <tr
                key={entry.userId}
                className={`border-b border-[#ffe7cb] last:border-b-0 ${
                  isYou ? 'bg-[rgba(255,208,153,0.53)]' : ''
                }`}
              >
                <td className="px-4 py-2.5 text-xs font-semibold text-[#7a3810]">
                  {entry.rank}
                </td>
                <td className="px-4 py-2.5">
                  <ProfileLink
                    username={entry.username}
                    className="font-semibold text-[#3d1200] hover:underline"
                  >
                    {entry.displayName || entry.username}
                  </ProfileLink>
                  {isYou ? (
                    <span className="ml-2 rounded bg-[#f2652a] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                      You
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7a3810]">
                  {formatNumber(entry.totalWins)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#7a3810]">
                  {formatNumber(entry.totalScore)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#7a3810]">
                  {formatNumber(entry.gamesPlayed)}
                </td>
                <td className="px-4 py-2.5 text-right text-[#7a3810]">
                  {formatWinRate(entry.winRate)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default LeaderboardRankingTable
