import DirectionIndicator from './_components/DirectionIndicator'
import DiscardPile from './_components/DiscardPile'
import DrawPile from './_components/DrawPile'
import Uno from './_components/Uno'

const CenterZone = ({
  deckSize,
  direction,
  isUnoVisible,
  onDrawPileClick,
  onUnoClick,
  pendingDraw,
  topCard,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <DrawPile deckSize={deckSize} onDrawPileClick={onDrawPileClick} />
      <DiscardPile pendingDraw={pendingDraw} topCard={topCard} />
      <DirectionIndicator direction={direction}>
        {isUnoVisible && <Uno onUnoClick={onUnoClick} />}
      </DirectionIndicator>
    </div>
  )
}

export default CenterZone
