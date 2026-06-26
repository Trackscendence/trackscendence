import profileFormatters from '../../_utils/profileFormatters'

const getAchievements = ({ friendsCount, stats }) => {
  const wins = stats.wins || 0
  const gamesPlayed = stats.gamesPlayed || 0
  const winRate = profileFormatters.getWinRate(stats)

  return [
    { id: 'first-win', label: 'First win', mark: '1', unlocked: wins >= 1 },
    { id: 'five-wins', label: 'Five wins', mark: '5', unlocked: wins >= 5 },
    {
      id: 'ten-games',
      label: '10 games',
      mark: '10',
      unlocked: gamesPlayed >= 10,
    },
    {
      id: 'sharp-rate',
      label: '50% rate',
      mark: '%',
      unlocked: gamesPlayed > 0 && winRate >= 50,
    },
    {
      id: 'connected',
      label: 'Friend list',
      mark: '+',
      unlocked: friendsCount > 0,
    },
  ]
}

const ProfileAchievements = ({ friendsCount = 0, stats = {} }) => {
  const achievements = getAchievements({ friendsCount, stats })

  return (
    <section className="bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#3d1200] uppercase">
        Achievements
      </h2>

      <div className="flex flex-wrap gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex w-16 flex-col items-center gap-1.5"
          >
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-semibold ${
                achievement.unlocked
                  ? 'border-[#e86d2f] bg-[#ffd099] text-[#e86d2f]'
                  : 'border-[#ddd] bg-[#f0f0f0] text-[#9b8b82] opacity-45'
              }`}
            >
              {achievement.mark}
            </span>
            <span className="text-center text-[10px] leading-tight text-[#7a3810]">
              {achievement.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProfileAchievements
