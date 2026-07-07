import { bump } from '@/dev/renderCounter'
import HandCard from './_components/HandCard'

// A card is 154px wide. Small hands sit at the default 36px overlap; larger
// hands tighten the overlap so the whole fan stays inside FAN_MAX_WIDTH instead
// of running off the screen, never hiding more than CARD_WIDTH - MIN_VISIBLE of
// any card.
const CARD_WIDTH = 154
const DEFAULT_OVERLAP = 36
const MIN_VISIBLE = 26
const FAN_MAX_WIDTH = 1040

const overlapFor = (count) => {
  if (count <= 1) return 0
  // Overlap that packs `count` cards into FAN_MAX_WIDTH.
  const packed = CARD_WIDTH - (FAN_MAX_WIDTH - CARD_WIDTH) / (count - 1)
  return Math.min(Math.max(DEFAULT_OVERLAP, packed), CARD_WIDTH - MIN_VISIBLE)
}

const PlayerHand = ({ cards, onCardClick, player }) => {
  bump('playerHand')
  const overlap = overlapFor(cards.length)

  return (
    <div className="w-full overflow-hidden">
      <ul
        aria-label={`${player.username}'s hand`}
        className="flex min-h-[236px] items-end justify-center px-4 pt-6 pb-3"
      >
        {cards.map((card, cardPosition) => (
          <li
            className="relative shrink-0"
            key={card.id}
            // Overlap and stacking order scale with the hand size, so the fan
            // stays on screen and each card sits above the one to its left.
            style={{
              marginLeft: cardPosition === 0 ? 0 : `-${overlap}px`,
              zIndex: cardPosition,
            }}
          >
            <HandCard
              {...card}
              cardPosition={cardPosition}
              onCardClick={onCardClick}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerHand
