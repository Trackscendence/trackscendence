import Card from '@/components/Card'

const HORIZONTAL_OFFSETS = [
  'left-0',
  'left-[24px]',
  'left-[48px]',
  'left-[72px]',
  'left-[96px]',
  'left-[120px]',
]

const VERTICAL_OFFSETS = [
  'top-0',
  'top-[69px]',
  'top-[138px]',
  'top-[207px]',
  'top-[276px]',
  'top-[345px]',
]

const HORIZONTAL_WIDTHS = [
  'w-[154px]',
  'w-[178px]',
  'w-[202px]',
  'w-[226px]',
  'w-[250px]',
  'w-[274px]',
]

const VERTICAL_HEIGHTS = [
  'h-[213px]',
  'h-[282px]',
  'h-[351px]',
  'h-[420px]',
  'h-[489px]',
  'h-[558px]',
]

const getCardIds = (playerId, cardCount) => {
  const visibleCount = Math.min(cardCount, 6)
  return Array.from(
    { length: visibleCount },
    (_, cardNumber) => `${playerId}-hidden-${cardNumber + 1}`,
  )
}

const OpponentCardStack = ({ orientation, player }) => {
  const isTop = orientation === 'top'
  const offsets = isTop ? HORIZONTAL_OFFSETS : VERTICAL_OFFSETS
  const cardIds = getCardIds(player.id, player.cardCount)
  const sizeIndex = Math.max(cardIds.length - 1, 0)
  const stackSize = isTop
    ? `h-[213px] ${HORIZONTAL_WIDTHS[sizeIndex]}`
    : `${VERTICAL_HEIGHTS[sizeIndex]} w-[154px]`

  return (
    <div
      aria-label={`${player.username} has ${player.cardCount} cards`}
      role="img"
      className={`relative shrink-0 ${stackSize}`}
    >
      {cardIds.map((cardId, cardPosition) => (
        <div className={`absolute ${offsets[cardPosition]}`} key={cardId}>
          <Card faceDown playable={false} tabIndex={-1} />
        </div>
      ))}
    </div>
  )
}

export default OpponentCardStack
