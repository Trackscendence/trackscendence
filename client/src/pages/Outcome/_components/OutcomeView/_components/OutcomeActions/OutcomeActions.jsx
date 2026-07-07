import Button from '@/components/Button'
import LobbyChip from '@/components/LobbyChip'

// The two ways out of the results screen. "Play Again" re-queues for a new
// match; the Lobby chip (the same one the profile header uses) returns to the
// lobby. A presenter: the container owns where each one goes.
const OutcomeActions = ({ onPlayAgain, onHome }) => {
  return (
    <div className="animate-oc-rise-3 flex w-full max-w-md flex-col gap-3 motion-reduce:animate-none sm:flex-row">
      <Button variant="orange" onClick={onPlayAgain}>
        Play Again
      </Button>
      <LobbyChip
        onClick={onHome}
        variant="neutral"
        className="h-[42px] w-full sm:w-auto sm:px-8"
      />
    </div>
  )
}

export default OutcomeActions
