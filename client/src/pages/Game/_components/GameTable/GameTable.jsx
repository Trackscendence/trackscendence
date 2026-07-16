import CenterZone from '../CenterZone'
import OpponentSlot from '../OpponentSlot'
import PassTurnButton from '../PassTurnButton'
import PlayerHand from '../PlayerHand'
import TurnBanner from '../TurnBanner'
import TurnSplash from '../TurnSplash'
import MobileOpponentChip from './_components/MobileOpponentChip'

const TOP_SEATS = ['top-left', 'top', 'top-right']

const getOpponentBySeat = (opponents, seat) => {
  return opponents.find((player) => player.seat === seat)
}

const getOpponentsBySeat = (opponents, seats) => {
  return seats.map((seat) => getOpponentBySeat(opponents, seat)).filter(Boolean)
}

const getTopScaleClass = (opponentCount) => {
  if (opponentCount >= 3) return 'scale-[0.72]'
  if (opponentCount === 2) return 'scale-[0.76]'
  return 'scale-[0.8]'
}

const getSidePositionClass = (topOpponentCount) => {
  if (topOpponentCount >= 2) return 'md:top-[52%]'
  return 'md:top-[38%]'
}

// The desktop table is fixed geometry: opponents absolutely positioned around
// the felt, tuned per seat count. Below md that composition cannot fit, so the
// portrait layout swaps the scaled card-stack slots for a wrapping band of
// MobileOpponentChip at the far end of the table (in turn order), keeps the
// piles in the middle, and gives the hand the full bottom edge.
const GameTable = ({
  activePlayerName,
  canDraw,
  canPass,
  currentPlayer,
  currentTurnPlayerId,
  deckSize,
  direction,
  isMyTurn,
  onCallUno,
  onCardClick,
  onCatchUno,
  onDrawPileClick,
  onPassClick,
  opponents,
  pendingDraw,
  topCard,
  turnExpiresAt,
  uno,
}) => {
  const topOpponents = getOpponentsBySeat(opponents, TOP_SEATS)
  const leftOpponent = getOpponentBySeat(opponents, 'left')
  const rightOpponent = getOpponentBySeat(opponents, 'right')
  const topScaleClass = getTopScaleClass(topOpponents.length)
  const sidePositionClass = getSidePositionClass(topOpponents.length)

  return (
    <section className="bg-surface-warm relative min-h-[100svh] w-full overflow-x-hidden px-2 pt-2 pb-4 text-black sm:px-6 sm:pt-4 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-0.5rem)] w-full max-w-[1440px] grid-cols-1 grid-rows-[auto_1fr_auto] gap-2 [grid-template-areas:'opponents'_'center'_'bottom'] sm:gap-4 md:relative md:block md:h-[calc(100svh-1rem)] md:min-h-0">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-10 pt-1 [grid-area:opponents] md:hidden">
          {opponents.map((opponent) => (
            <MobileOpponentChip
              isActive={opponent.id === currentTurnPlayerId}
              key={opponent.id}
              player={opponent}
            />
          ))}
        </div>

        {topOpponents.length > 0 && (
          <div className="hidden md:absolute md:top-0 md:left-1/2 md:flex md:w-full md:max-w-[820px] md:-translate-x-1/2 md:items-start md:justify-center lg:max-w-[920px]">
            <div className="flex w-full flex-wrap items-start justify-around gap-x-2 gap-y-3">
              {topOpponents.map((opponent) => (
                <div
                  className={`origin-top ${topScaleClass}`}
                  key={opponent.id}
                >
                  <OpponentSlot
                    isActive={opponent.id === currentTurnPlayerId}
                    orientation={opponent.seat}
                    player={opponent}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {leftOpponent && (
          <div
            className={`hidden md:absolute md:left-0 md:flex md:-translate-y-1/2 md:items-center md:justify-start ${sidePositionClass}`}
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

        <div className="relative flex min-h-52 items-center justify-center [grid-area:center] sm:min-h-72 md:absolute md:top-1/2 md:left-1/2 md:min-h-0 md:-translate-x-1/2 md:-translate-y-1/2">
          <CenterZone
            canDraw={canDraw}
            deckSize={deckSize}
            direction={direction}
            onCallUno={onCallUno}
            onCatchUno={onCatchUno}
            onDrawPileClick={onDrawPileClick}
            pendingDraw={pendingDraw}
            topCard={topCard}
            uno={uno}
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
            className={`hidden md:absolute md:right-0 md:flex md:-translate-y-1/2 md:items-center md:justify-end ${sidePositionClass}`}
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
          {/* Below md the wrapper widens by 1/scale so the scaled fan spans
              the full device width edge to edge; PlayerHand scrolls sideways
              inside that space so every card stays reachable. */}
          <div className="-mx-[30.5%] w-[161%] origin-bottom scale-[0.62] sm:-mx-[19.5%] sm:w-[139%] sm:scale-[0.72] md:mx-0 md:w-full md:scale-[0.8]">
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
