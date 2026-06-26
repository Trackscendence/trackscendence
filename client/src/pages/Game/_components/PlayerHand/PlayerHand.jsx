import Card from '@/components/Card'

const CARD_LAYER_CLASSES = ['z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50']

const PlayerHand = ({ cards, player }) => {
  return (
    <div className="w-full overflow-hidden">
      <ul
        aria-label={`${player.username}'s hand`}
        className="flex min-h-[236px] items-end justify-start overflow-x-auto px-4 pt-6 pb-3 sm:justify-center"
      >
        {cards.map((card, cardPosition) => (
          <li
            className={`relative ${CARD_LAYER_CLASSES[cardPosition] ?? 'z-50'} ${cardPosition === 0 ? 'shrink-0' : '-ml-9 shrink-0'}`}
            key={card.id}
          >
            <Card {...card} playable={false} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerHand
