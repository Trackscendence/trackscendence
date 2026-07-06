import DirectionIndicator from './_components/DirectionIndicator'
import DiscardPile from './_components/DiscardPile'
import DrawPile from './_components/DrawPile'
import Uno from './_components/Uno'

const CenterZone = ({
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
      <DrawPile deckSize={deckSize} onDrawPileClick={onDrawPileClick} />
      <DiscardPile pendingDraw={pendingDraw} topCard={topCard} />
      <DirectionIndicator
        bottomOverlay={isOwnUno ? <Uno onUnoClick={onUnoClick} /> : null}
        direction={direction}
        topOverlay={isOpponentUno ? <Uno /> : null}
      />
    </div>
  )
}

export default CenterZone
