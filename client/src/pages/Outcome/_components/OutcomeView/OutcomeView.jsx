import OutcomeConfetti from './_components/OutcomeConfetti'
import OutcomeHeadline from './_components/OutcomeHeadline'
import OutcomeLeaderboard from './_components/OutcomeLeaderboard'
import OutcomeActions from './_components/OutcomeActions'

// Full-page results layout — no navbar, its own warm `surface-outcome` surface,
// a sibling screen to the waiting room. Composes the headline, the leaderboard
// snapshot, and the two actions. Confetti fires only when the copy says so.
const OutcomeView = ({
  title,
  subtitle,
  celebrate,
  rows,
  currentUserId,
  onPlayAgain,
  onHome,
}) => {
  return (
    <main className="bg-surface-outcome relative flex min-h-[100svh] flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12">
      {celebrate ? <OutcomeConfetti /> : null}
      <div className="relative z-20 flex flex-col items-center gap-8">
        <OutcomeHeadline title={title} subtitle={subtitle} />
        <OutcomeLeaderboard rows={rows} currentUserId={currentUserId} />
        <OutcomeActions onPlayAgain={onPlayAgain} onHome={onHome} />
      </div>
    </main>
  )
}

export default OutcomeView
