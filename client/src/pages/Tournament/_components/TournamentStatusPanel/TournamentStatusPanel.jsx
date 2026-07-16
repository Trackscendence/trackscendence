import Button from '@/components/Button'

// Copy for the open state, written as direction: the creator learns exactly
// what still has to happen before they can start, and a joined player learns
// their seat is safe and what triggers the first round.
const waitingMessage = (isCreator, seatsLeft) => {
  if (!isCreator) {
    return 'Your seat is saved. The bracket begins the moment every seat fills.'
  }
  if (seatsLeft > 0) {
    return `Start the bracket once ${seatsLeft} more ${
      seatsLeft === 1 ? 'player joins' : 'players join'
    }.`
  }
  return 'Every seat is taken — start the bracket whenever you are ready.'
}

// The open-tournament header above the preview bracket: identity, seat
// progress, prize, and the role-aware actions. Kept quiet on purpose — the
// bracket filling in below is the thing to watch. Pure presenter.
const TournamentStatusPanel = ({
  isBusy,
  isCreator,
  name,
  playerCount,
  prizePoints,
  size,
  onLeave,
  onStart,
}) => {
  const isFull = playerCount >= size
  const seatsLeft = Math.max(0, size - playerCount)
  const filledPercent = size > 0 ? Math.min(100, (playerCount / size) * 100) : 0

  return (
    <section className="w-full rounded-2xl border-[0.5px] border-white/80 bg-white/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-[#2A1A08]">{name}</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isFull
                  ? 'bg-[#dff0df] text-[#2f7d61]'
                  : 'bg-[#fbe6cf] text-[#b5651d]'
              }`}
            >
              {isFull ? 'Ready to start' : 'Filling up'}
            </span>
          </div>
          {prizePoints != null ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#9A7050]">
              <span aria-hidden="true">🏆</span>
              {prizePoints} pts prize
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
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
      </div>

      <div className="mt-5 max-w-md">
        <div className="flex items-center justify-between text-sm font-medium text-[#2A1A08]">
          <span>Seats</span>
          <span className="text-[#9A7050] tabular-nums">
            {playerCount} of {size}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f0dcc4]">
          <div
            className="h-full rounded-full bg-[#e86d2f] transition-[width] duration-300"
            style={{ width: `${filledPercent}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#2A1A08]">
        {waitingMessage(isCreator, seatsLeft)}
      </p>
    </section>
  )
}

export default TournamentStatusPanel
