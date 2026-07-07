import CenterZone from '../CenterZone'
import OpponentSlot from '../OpponentSlot'
import PassTurnButton from '../PassTurnButton'
import PlayerHand from '../PlayerHand'
import TurnBanner from '../TurnBanner'
import TurnSplash from '../TurnSplash'

const TOP_SEATS = ['top-left', 'top', 'top-right']

const getOpponentBySeat = (opponents, seat) => {
  return opponents.find((player) => player.seat === seat)
}

const getOpponentsBySeat = (opponents, seats) => {
  return seats.map((seat) => getOpponentBySeat(opponents, seat)).filter(Boolean)
}

const getTopScaleClass = (opponentCount) => {
  if (opponentCount >= 3) return 'scale-[0.66] sm:scale-[0.72]'
  if (opponentCount === 2) return 'scale-[0.72] sm:scale-[0.76]'
  return 'scale-[0.8]'
}

const getSidePositionClass = (topOpponentCount) => {
  if (topOpponentCount >= 2) return 'md:top-[52%]'
  return 'md:top-[38%]'
}

const GameTable = ({
  activePlayerName,
  canDraw,
  canPass,
  currentPlayer,
  currentTurnPlayerId,
  deckSize,
  direction,
  isMyTurn,
  onCardClick,
  onDrawPileClick,
  onPassClick,
  onUnoClick,
  opponents,
  pendingDraw,
  topCard,
  turnExpiresAt,
}) => {
  const topOpponents = getOpponentsBySeat(opponents, TOP_SEATS)
  const leftOpponent = getOpponentBySeat(opponents, 'left')
  const rightOpponent = getOpponentBySeat(opponents, 'right')
  const topScaleClass = getTopScaleClass(topOpponents.length)
  const sidePositionClass = getSidePositionClass(topOpponents.length)

  return (
    <section className="bg-surface-warm relative min-h-[100svh] w-full overflow-x-hidden px-4 pt-4 text-black sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-1rem)] w-full max-w-[1440px] grid-cols-1 grid-rows-[auto_auto_auto_auto_auto] gap-4 [grid-template-areas:'top'_'center'_'left'_'right'_'bottom'] md:relative md:block md:h-[calc(100svh-1rem)] md:min-h-0">
        <div className="flex min-h-48 items-start justify-center [grid-area:top] md:absolute md:top-0 md:left-1/2 md:min-h-0 md:w-full md:max-w-[820px] md:-translate-x-1/2 lg:max-w-[920px]">
          <div className="flex w-full flex-wrap items-start justify-center gap-x-2 gap-y-3 md:justify-around">
            {topOpponents.map((opponent) => (
              <div className={`origin-top ${topScaleClass}`} key={opponent.id}>
                <OpponentSlot
                  isActive={opponent.id === currentTurnPlayerId}
                  orientation={opponent.seat}
                  player={opponent}
                />
              </div>
            ))}
          </div>
        </div>

        {leftOpponent && (
          <div
            className={`flex min-h-[21rem] items-center justify-center [grid-area:left] md:absolute md:left-0 md:min-h-0 md:-translate-y-1/2 md:justify-start ${sidePositionClass}`}
          >
            <div className="origin-left scale-[0.8]">
              <OpponentSlot
                isActive={leftOpponent.id === currentTurnPlayerId}
                orientation="left"
                player={leftOpponent}
              />
            </div>
          </div>
        )}

        <div className="relative flex min-h-72 items-center justify-center [grid-area:center] md:absolute md:top-1/2 md:left-1/2 md:min-h-0 md:-translate-x-1/2 md:-translate-y-1/2">
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
          <div className="absolute top-full left-1/2 mt-2 -translate-x-1/2">
            <TurnBanner
              activePlayerName={activePlayerName}
              expiresAt={turnExpiresAt}
              isMyTurn={isMyTurn}
            />
          </div>
        </div>

        {rightOpponent && (
          <div
            className={`flex min-h-[21rem] items-center justify-center [grid-area:right] md:absolute md:right-0 md:min-h-0 md:-translate-y-1/2 md:justify-end ${sidePositionClass}`}
          >
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
      <TurnSplash expiresAt={turnExpiresAt} isMyTurn={isMyTurn} />
    </section>
  )
}

export default GameTable
