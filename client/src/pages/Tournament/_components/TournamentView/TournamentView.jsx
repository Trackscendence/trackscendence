import AppHeader from '@/components/AppHeader'

// The warm-surface shell for the tournament page, mirroring LobbyView so the
// signed-in pages share one visual family. The page container picks which
// state to show (lobby, waiting card, bracket) and passes it as children; the
// shell also renders the page-level error banner so every state reports
// failures the same way.
const TournamentView = ({ children, error }) => {
  return (
    <div className="bg-surface-warm flex min-h-[100dvh] flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="text-[clamp(42px,10vw,80px)] leading-none font-black tracking-[-0.025em] text-[#E86D2F]">
          TOURNAMENT
        </h1>
        {error ? (
          <p className="mt-6 max-w-3xl rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
            {error}
          </p>
        ) : null}
        <div className="pt-8">{children}</div>
      </main>
    </div>
  )
}

export default TournamentView
