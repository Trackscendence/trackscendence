import Button from '@/components/Button'

// Copy for the waiting state. The creator learns what still has to happen
// before they can start the bracket; joiners just know their seat is safe.
const waitingMessage = (isCreator, seatsLeft) => {
  if (!isCreator) {
    return 'Waiting for the bracket to fill. The tournament starts when every seat is taken.'
  }
  if (seatsLeft > 0) {
    return `You can start the tournament once ${seatsLeft} more ${
      seatsLeft === 1 ? 'player joins' : 'players join'
    }.`
  }
  return 'All seats are filled — start the bracket when you are ready.'
}

// The joined-but-still-OPEN state: seat counter, prize, and the way out. The
// creator also gets the start button, enabled only once every seat is taken.
const TournamentWaitingCard = ({
  isBusy,
  isCreator,
  name,
  playerCount,
  prizePoints,
  size,
  onLeave,
  onStart,
}) => {
  const isFull = playerCount === size

  return (
    <section className="max-w-md rounded-2xl border-[0.5px] border-white/80 bg-white/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h2 className="text-base font-bold text-[#2A1A08]">{name}</h2>
      <p className="mt-1 text-sm text-[#9A7050]">
        {playerCount}/{size} seats filled
      </p>
      {prizePoints != null ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#9A7050]">
          <span aria-hidden="true">🏆</span>
          {prizePoints} pts prize
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-[#2A1A08]">
        {waitingMessage(isCreator, size - playerCount)}
      </p>
      <div className="mt-6 flex items-center gap-3">
        {isCreator ? (
          <Button
            disabled={isBusy || !isFull}
            fullWidth={false}
            variant="orange"
            onClick={onStart}
          >
            Start tournament
          </Button>
        ) : null}
        <Button
          disabled={isBusy}
          fullWidth={false}
          variant="danger"
          onClick={onLeave}
        >
          Leave tournament
        </Button>
      </div>
    </section>
  )
}

export default TournamentWaitingCard
