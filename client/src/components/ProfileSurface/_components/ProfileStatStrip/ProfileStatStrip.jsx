import profileFormatters from '../../_utils/profileFormatters'

const ProfileStatStrip = ({ stats = {} }) => {
  const summaryStats = [
    { label: 'Games', value: stats.gamesPlayed || 0 },
    { label: 'Wins', value: stats.wins || 0 },
    { label: 'Rank', value: profileFormatters.formatRank(stats.rank) },
    { label: 'Win Rate', value: `${profileFormatters.getWinRate(stats)}%` },
  ]

  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
      {summaryStats.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-[#3d1200]">
            {item.value}
          </span>
          <span className="text-xs text-[#7a3810]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default ProfileStatStrip
