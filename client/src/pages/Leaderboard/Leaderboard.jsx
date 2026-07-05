import LeaderboardSection from './_components/LeaderboardSection'
import PlayerFinder from './_components/PlayerFinder'

const Leaderboard = () => {
  return (
    <div className="space-y-7">
      <section className="bg-[#ffd099] px-7 py-8">
        <h1 className="text-3xl font-bold text-[#3d1200]">Leaderboard</h1>
      </section>

      <PlayerFinder />
      <LeaderboardSection />
    </div>
  )
}

export default Leaderboard
