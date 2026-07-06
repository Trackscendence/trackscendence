import DirectionIndicator from './_components/DirectionIndicator'
import DiscardPile from './_components/DiscardPile'
import DrawPile from './_components/DrawPile'
import Uno from './_components/Uno'

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
    <div className="flex flex-wrap items-center justify-center gap-5">
      {/* The draw pile is a full card (w-[154px]) but the direction markers are
          narrower, so centering all three as a group left the discard pile —
          the focal point — off the center line. Reserve one card-width per
          flanker and hug each inward, so the discard pile lands on the exact
          center line with symmetric gaps. */}
      <div className="flex w-[154px] shrink-0 justify-end">
        <DrawPile
          canDraw={canDraw}
          deckSize={deckSize}
          onDrawPileClick={onDrawPileClick}
        />
      </div>
      <DiscardPile pendingDraw={pendingDraw} topCard={topCard} />
      <div className="flex w-[154px] shrink-0 justify-start">
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
