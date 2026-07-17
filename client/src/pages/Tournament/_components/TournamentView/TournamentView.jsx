import Layout from '@/layouts/Layout'

// The warm-surface shell for the tournament page, mirroring LobbyView so the
// signed-in pages share one visual family. The page container picks which
// state to show (lobby, waiting card, bracket) and passes it as children; the
// shell also renders the page-level error banner so every state reports
// failures the same way.
const TournamentView = ({ children, error }) => {
  return (
    <Layout>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <h1 className="text-[clamp(42px,10vw,80px)] leading-none font-black tracking-[-0.025em] text-[#E86D2F]">
            TOURNAMENT
          </h1>
          {error ? (
            <p className="mt-6 rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
              {error}
            </p>
          ) : null}
          <div className="pt-8">{children}</div>
        </div>
      </main>
    </Layout>
  )
}

export default TournamentView
