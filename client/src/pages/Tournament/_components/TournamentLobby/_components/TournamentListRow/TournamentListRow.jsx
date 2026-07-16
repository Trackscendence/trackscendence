import Button from '@/components/Button'

// One open tournament in the lobby list: name, how full it is, the prize,
// and the way in. Joins are disabled while another request is in flight so a
// double click cannot fire two joins.
const TournamentListRow = ({
  isBusy,
  name,
  playerCount,
  prizePoints,
  size,
  onJoin,
}) => {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border-[0.5px] border-white/80 bg-white/50 px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#2A1A08]">{name}</p>
        <p className="mt-0.5 text-xs text-[#9A7050]">
          {playerCount}/{size} seats filled · {prizePoints} pts prize
        </p>
      </div>
      <Button
        disabled={isBusy}
        fullWidth={false}
        variant="orange"
        onClick={onJoin}
      >
        Join
      </Button>
    </li>
  )
}

export default TournamentListRow
