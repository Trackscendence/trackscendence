import Layout from '@/layouts/Layout'
import LeaderboardSection from '@/components/LeaderboardSection'

// The warm-surface shell for the leaderboard page, mirroring TournamentView so
// the signed-in pages share one visual family. All data loading lives inside
// LeaderboardSection, so the page only provides the shell around it.
const Leaderboard = () => {
  return (
    <Layout>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="text-[clamp(42px,10vw,80px)] leading-none font-black tracking-[-0.025em] text-[#E86D2F]">
          LEADERBOARD
        </h1>
        <div className="pt-6">
          <LeaderboardSection />
        </div>
      </main>
    </Layout>
  )
}

export default Leaderboard
