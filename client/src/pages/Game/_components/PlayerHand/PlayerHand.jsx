import Card from '@/components/Card'

const PlayerHand = ({ cards, player }) => {
  return (
    <div className="w-full overflow-hidden">
      <ul
        aria-label={`${player.username}'s hand`}
        className="flex min-h-[236px] items-end justify-start overflow-x-auto px-4 pt-6 pb-3 sm:justify-center"
      >
        {cards.map((card, cardPosition) => (
          <li
            className={cardPosition === 0 ? 'shrink-0' : '-ml-9 shrink-0'}
            key={card.id}
          >
            <Card {...card} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerHand
