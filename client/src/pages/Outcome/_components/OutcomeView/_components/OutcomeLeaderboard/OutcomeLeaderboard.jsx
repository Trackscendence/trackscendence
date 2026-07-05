import LeaderboardTable from '@/components/LeaderboardTable'

// The results snapshot. Wraps the shared LeaderboardTable in the warm `#ffd099`
// band so it reads identically to the profile leaderboard, and shows the player
// their standing with a YOU badge and rank delta. A presenter: rows are handed
// in already windowed around the player.
const OutcomeLeaderboard = ({ rows, currentUserId }) => {
  return (
    <section className="animate-oc-rise-2 w-full max-w-md bg-[#ffd099] p-4 motion-reduce:animate-none">
      <p className="mb-3 text-xs font-semibold tracking-wide text-[#3d1200] uppercase">
        Leaderboard
      </p>
      <div className="bg-white/70 p-2">
        <LeaderboardTable
          rows={rows}
          currentUserId={currentUserId}
          showYouBadge
        />
      </div>
    </section>
  )
}

export default OutcomeLeaderboard
