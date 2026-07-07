import CenterZone from '../CenterZone'
import OpponentSlot from '../OpponentSlot'
import PassTurnButton from '../PassTurnButton'
import PlayerHand from '../PlayerHand'

const getOpponentBySeat = (opponents, seat) => {
  return opponents.find((player) => player.seat === seat)
}

const GameTable = ({
  canDraw,
  canPass,
  currentPlayer,
  currentTurnPlayerId,
  deckSize,
  direction,
  onCardClick,
  onDrawPileClick,
  onPassClick,
  onUnoClick,
  opponents,
  pendingDraw,
  topCard,
}) => {
  const topOpponent = getOpponentBySeat(opponents, 'top')
  const leftOpponent = getOpponentBySeat(opponents, 'left')
  const rightOpponent = getOpponentBySeat(opponents, 'right')

  return (
    <section className="bg-surface-warm min-h-[100svh] w-full overflow-x-hidden px-4 pt-4 text-black sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-1rem)] w-full max-w-[1440px] grid-cols-1 grid-rows-[auto_auto_auto_auto_auto] gap-4 [grid-template-areas:'top'_'center'_'left'_'right'_'bottom'] md:relative md:block md:h-[calc(100svh-1rem)] md:min-h-0">
        <div className="flex min-h-48 items-start justify-center [grid-area:top] md:absolute md:top-0 md:left-1/2 md:min-h-0 md:-translate-x-1/2">
          {topOpponent && (
            <div className="origin-top scale-[0.8]">
              <OpponentSlot
                isActive={topOpponent.id === currentTurnPlayerId}
                orientation="top"
                player={topOpponent}
              />
            </div>
          )}
        </div>

        {leftOpponent && (
          <div className="flex min-h-[21rem] items-center justify-center [grid-area:left] md:absolute md:top-[38%] md:left-0 md:min-h-0 md:-translate-y-1/2 md:justify-start">
            <div className="origin-left scale-[0.8]">
              <OpponentSlot
                isActive={leftOpponent.id === currentTurnPlayerId}
                orientation="left"
                player={leftOpponent}
              />
            </div>
          </div>
        )}

        <div className="flex min-h-72 items-center justify-center [grid-area:center] md:absolute md:top-1/2 md:left-1/2 md:min-h-0 md:-translate-x-1/2 md:-translate-y-1/2">
          <CenterZone
            canDraw={canDraw}
            deckSize={deckSize}
            direction={direction}
            isOpponentUno={opponents.some(
              (opponent) => opponent.cardCount === 1,
            )}
            isOwnUno={currentPlayer.cards.length === 1}
            onDrawPileClick={onDrawPileClick}
            onUnoClick={onUnoClick}
            pendingDraw={pendingDraw}
            topCard={topCard}
          />
        </div>

        {rightOpponent && (
          <div className="flex min-h-[21rem] items-center justify-center [grid-area:right] md:absolute md:top-[38%] md:right-0 md:min-h-0 md:-translate-y-1/2 md:justify-end">
            <div className="origin-right scale-[0.8]">
              <OpponentSlot
                isActive={rightOpponent.id === currentTurnPlayerId}
                orientation="right"
                player={rightOpponent}
              />
            </div>
          </div>
        )}

        <div className="relative flex items-end justify-center [grid-area:bottom] md:absolute md:right-0 md:bottom-0 md:left-0">
          {/* Floats above the hand's stacked cards (they layer up to z-50),
              so the pass action stays clickable over the card fan. */}
          {canPass && (
            <div className="absolute top-0 left-1/2 z-[60] -translate-x-1/2">
              <PassTurnButton onPassClick={onPassClick} />
            </div>
          )}
          <div className="w-full origin-bottom scale-[0.8]">
            <PlayerHand
              cards={currentPlayer.cards}
              onCardClick={onCardClick}
              player={currentPlayer}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default GameTable
