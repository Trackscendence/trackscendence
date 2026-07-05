const LeaderboardPlaceholder = () => {
  return (
    <div className="space-y-7">
      <section className="bg-[#ffd099] px-7 py-8">
        <h1 className="text-3xl font-bold text-[#3d1200]">Leaderboard</h1>
      </section>

      <section className="bg-[#ffd099] p-6">
        <div className="bg-white px-5 py-8 text-sm font-semibold text-[#7a3810]">
          No ranked players yet.
        </div>
      </section>
    </div>
  )
}

export default LeaderboardPlaceholder
