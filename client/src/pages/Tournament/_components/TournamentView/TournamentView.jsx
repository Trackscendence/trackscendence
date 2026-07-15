import AppHeader from '@/components/AppHeader'
import TournamentBracket from './_components/TournamentBracket'
import TournamentEmptyState from './_components/TournamentEmptyState'

// The warm-surface shell for the tournament page, mirroring LobbyView so the
// signed-in pages share one visual family. Renders the bracket when a
// tournament is active and the coming-soon state otherwise.
const TournamentView = ({ bracket }) => {
  return (
    <div className="bg-surface-warm flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col px-8 py-8">
        <h1 className="text-[clamp(48px,6vw,80px)] leading-none font-black tracking-[-0.025em] text-[#E86D2F]">
          TOURNAMENT
        </h1>
        <div className="pt-8">
          {bracket ? (
            <TournamentBracket bracket={bracket} />
          ) : (
            <TournamentEmptyState />
          )}
        </div>
      </main>
    </div>
  )
}

export default TournamentView
