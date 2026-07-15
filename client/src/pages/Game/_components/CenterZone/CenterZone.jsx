import DirectionIndicator from './_components/DirectionIndicator'
import DiscardPile from './_components/DiscardPile'
import DrawPile from './_components/DrawPile'
import Uno from './_components/Uno'

// One card-width per flanker keeps the draw pile and direction markers
// symmetric, so the discard pile — the focal point — lands on the exact center
// line. The gap and 0.8 scale are the tuned table values (see GameTable, which
// scales the hand and opponents to match).
const FLANKER = 'flex w-[154px] shrink-0'

// Bottom (my) side: a call button until I call, then a safe badge.
const renderOwnUno = (own, onCallUno) => {
  if (!own) return null
  if (own.called) return <Uno />
  return (
    <Uno
      arrow
      onClick={onCallUno}
      title="Call UNO before your opponent plays"
    />
  )
}

// Top (opponent) side: a catch button until they call, then a passive warning.
const renderOpponentUno = (opponent, onCatchUno) => {
  if (!opponent) return null
  if (opponent.called) return <Uno />
  return (
    <Uno
      label="CATCH!"
      onClick={() => onCatchUno(opponent.targetId)}
      title="They forgot UNO — catch them for a 2-card penalty"
    />
  )
}

const CenterZone = ({
  canDraw,
  deckSize,
  direction,
  uno,
  onCallUno,
  onCatchUno,
  onDrawPileClick,
  pendingDraw,
  topCard,
}) => {
  return (
    <div className="flex scale-[0.64] flex-wrap items-center justify-center gap-[10px] sm:scale-[0.75] sm:gap-[14px] md:scale-[0.8]">
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
          bottomOverlay={renderOwnUno(uno?.own ?? null, onCallUno)}
          direction={direction}
          topOverlay={renderOpponentUno(uno?.opponent ?? null, onCatchUno)}
        />
      </div>
    </div>
  )
}

export default CenterZone
