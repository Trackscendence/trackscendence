import Card from '@/components/Card'

const COLOR_CLASSES = {
  blue: 'bg-[#3684CC]',
  green: 'bg-[#489E52]',
  red: 'bg-[#EA5A2A]',
  wild: 'bg-black',
  yellow: 'bg-[#F4C745]',
}

const TurnArrow = () => (
  <span
    aria-hidden="true"
    className="block h-0 w-0 border-x-[28px] border-b-[43px] border-x-transparent border-b-[#969595]"
  />
)

const CenterPile = ({
  currentColor,
  currentTurnPlayerName,
  deckSize,
  direction,
  topCard,
}) => {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-5">
        <div className="relative">
          <Card faceDown tabIndex={-1} />
          <span className="absolute -right-3 -bottom-3 rounded-full bg-black px-3 py-1 text-sm font-bold text-white">
            {deckSize}
          </span>
        </div>
        <Card {...topCard} tabIndex={-1} />
        <div
          aria-label={`Play direction is ${direction}`}
          className="flex flex-col gap-5"
          role="img"
        >
          <TurnArrow />
          <TurnArrow />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-full bg-white/55 px-4 py-2 text-sm font-semibold text-black">
        <span
          aria-label={`Current color is ${currentColor}`}
          className={`size-4 rounded-full ${COLOR_CLASSES[currentColor] ?? COLOR_CLASSES.wild}`}
          role="img"
        />
        <span>{`${currentTurnPlayerName}'s turn`}</span>
      </div>
    </div>
  )
}

export default CenterPile
