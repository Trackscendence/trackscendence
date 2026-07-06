import MatchTable from '../MatchTable'
import ProfileAchievements from '../ProfileAchievements'
import profileFormatters from '../../_utils/profileFormatters'

const ProfileOverview = ({ friendsCount = 0, onShowGames, profile }) => {
  const stats = profile.stats || {}
  const cards = [
    { label: 'Games Won', value: stats.wins || 0 },
    { label: 'Games Played', value: stats.gamesPlayed || 0 },
    { label: 'Current Rank', value: profileFormatters.formatRank(stats.rank) },
  ]
  const recentMatches = (profile.recentMatches || []).slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-5">
            <p className="text-2xl font-semibold text-[#3d1200]">
              {card.value}
            </p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-[#7a3810] uppercase">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <ProfileAchievements friendsCount={friendsCount} stats={stats} />

      {profile.bio && (
        <section className="bg-white p-5">
          <h2 className="text-sm font-semibold tracking-wide text-[#3d1200] uppercase">
            Bio
          </h2>
          <p className="mt-3 text-sm leading-6 break-words whitespace-pre-line text-[#7a3810]">
            {profile.bio}
          </p>
        </section>
      )}

      <section className="bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#fceee0] px-5 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-[#3d1200] uppercase">
            Recent Games
          </h2>
          <button
            className="bg-[#ffd099] px-3 py-1 text-xs font-semibold text-[#e86d2f] transition hover:bg-[#e86d2f] hover:text-white focus:ring-2 focus:ring-[#e86d2f]/30 focus:outline-none"
            type="button"
            onClick={onShowGames}
          >
            Full history <span aria-hidden="true">›</span>
          </button>
        </div>
        <MatchTable matches={recentMatches} />
      </section>
    </div>
  )
}

export default ProfileOverview
