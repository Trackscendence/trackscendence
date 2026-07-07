import DirectionIndicator from './_components/DirectionIndicator'
import DiscardPile from './_components/DiscardPile'
import DrawPile from './_components/DrawPile'
import Uno from './_components/Uno'

// One card-width per flanker keeps the draw pile and direction markers
// symmetric, so the discard pile — the focal point — lands on the exact center
// line. The gap and 0.8 scale are the tuned table values (see GameTable, which
// scales the hand and opponents to match).
const FLANKER = 'flex w-[154px] shrink-0'

const CenterZone = ({
  canDraw,
  deckSize,
  direction,
  isOpponentUno,
  isOwnUno,
  onDrawPileClick,
  onUnoClick,
  pendingDraw,
  topCard,
}) => {
  return (
    <div className="flex scale-[0.8] flex-wrap items-center justify-center gap-[14px]">
      <div className={`${FLANKER} justify-end`}>
        <DrawPile
          canDraw={canDraw}
          deckSize={deckSize}
          onDrawPileClick={onDrawPileClick}
        />
      </div>
      <DiscardPile pendingDraw={pendingDraw} topCard={topCard} />
      <div className={`${FLANKER} justify-start`}>
        <DirectionIndicator
          bottomOverlay={isOwnUno ? <Uno onUnoClick={onUnoClick} /> : null}
          direction={direction}
          topOverlay={isOpponentUno ? <Uno /> : null}
        />
      </div>
    </div>
  )
}

export default CenterZone
