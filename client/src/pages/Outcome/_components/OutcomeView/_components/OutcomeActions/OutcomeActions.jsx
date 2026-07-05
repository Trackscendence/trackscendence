import Button from '@/components/Button'

// The two ways out of the results screen. "Play Again" re-queues for a new
// match; "Home" returns to the dashboard. A presenter: the container owns where
// each one goes.
const OutcomeActions = ({ onPlayAgain, onHome }) => {
  return (
    <div className="animate-oc-rise-3 flex w-full max-w-md flex-col gap-3 motion-reduce:animate-none sm:flex-row">
      <Button variant="orange" onClick={onPlayAgain}>
        Play Again
      </Button>
      <Button variant="orangeOutline" onClick={onHome}>
        Home
      </Button>
    </div>
  )
}

export default OutcomeActions
