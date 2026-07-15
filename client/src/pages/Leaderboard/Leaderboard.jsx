import LeaderboardSection from './_components/LeaderboardSection'

const Leaderboard = () => {
  return (
    <div className="space-y-7">
      <section className="bg-[#ffd099] px-4 py-6 sm:px-7 sm:py-8">
        <h1 className="text-2xl font-bold text-[#3d1200] sm:text-3xl">
          Leaderboard
        </h1>
      </section>

      <LeaderboardSection />
    </div>
  )
}

export default Leaderboard
