import drawFourIcon from '@/assets/achievements/draw-four.svg'
import firstUnoIcon from '@/assets/achievements/first-uno.svg'
import socialButterflyIcon from '@/assets/achievements/social-butterfly.svg'
import speedDemonIcon from '@/assets/achievements/speed-demon.svg'
import winStreakIcon from '@/assets/achievements/win-streak.svg'
import profileFormatters from '../../_utils/profileFormatters'

const getAchievements = ({ friendsCount, stats }) => {
  const wins = stats.wins || 0
  const gamesPlayed = stats.gamesPlayed || 0
  const winRate = profileFormatters.getWinRate(stats)

  return [
    {
      id: 'first-uno',
      icon: firstUnoIcon,
      label: 'First UNO!',
      unlocked: gamesPlayed >= 1,
    },
    {
      id: 'win-streak',
      icon: winStreakIcon,
      label: 'Win Streak x5',
      unlocked: wins >= 5,
    },
    {
      id: 'draw-four',
      icon: drawFourIcon,
      label: 'Draw Four x10',
      unlocked: gamesPlayed >= 10,
    },
    {
      id: 'speed-demon',
      icon: speedDemonIcon,
      label: 'Speed Demon',
      unlocked: gamesPlayed > 0 && winRate >= 50,
    },
    {
      id: 'social-butterfly',
      icon: socialButterflyIcon,
      label: 'Social Butterfly',
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
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                achievement.unlocked
                  ? 'border-[#e86d2f] bg-[#ffd099]'
                  : 'border-[#ddd] bg-[#f0f0f0] opacity-45'
              }`}
            >
              <img
                alt=""
                className="h-6 w-6 object-contain"
                src={achievement.icon}
              />
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
