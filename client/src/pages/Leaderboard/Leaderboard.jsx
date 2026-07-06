import LeaderboardSection from './_components/LeaderboardSection'

const Leaderboard = () => {
  return (
    <div className="space-y-7">
      <section className="bg-[#ffd099] px-7 py-8">
        <h1 className="text-3xl font-bold text-[#3d1200]">Leaderboard</h1>
      </section>

      <LeaderboardSection />
    </div>
  )
}

export default Leaderboard
