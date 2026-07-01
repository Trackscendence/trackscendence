import OpponentSlot from '../OpponentSlot'
import PlayerHand from '../PlayerHand'
import CenterPile from './_components/CenterPile'

const getOpponentBySeat = (opponents, seat) => {
  return opponents.find((player) => player.seat === seat)
}

const GameTable = ({
  currentColor,
  currentPlayer,
  currentTurnPlayerId,
  deckSize,
  direction,
  opponents,
  topCard,
}) => {
  const topOpponent = getOpponentBySeat(opponents, 'top')
  const leftOpponent = getOpponentBySeat(opponents, 'left')
  const rightOpponent = getOpponentBySeat(opponents, 'right')
  const allPlayers = [currentPlayer, ...opponents]
  const currentTurnPlayer =
    allPlayers.find((player) => player.id === currentTurnPlayerId) ??
    currentPlayer

  return (
    <section className="min-h-[calc(100vh-8.75rem)] w-full overflow-hidden bg-[#FFE7CB] px-4 py-6 text-black sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[760px] w-full max-w-[1440px] grid-cols-1 grid-rows-[auto_auto_auto_auto_auto] gap-4 [grid-template-areas:'top'_'center'_'left'_'right'_'bottom'] md:grid-cols-[minmax(11rem,1fr)_minmax(26rem,1.5fr)_minmax(11rem,1fr)] md:grid-rows-[auto_minmax(24rem,1fr)_auto] md:gap-6 md:[grid-template-areas:'top_top_top'_'left_center_right'_'bottom_bottom_bottom']">
        <div className="flex min-h-[13.5rem] items-start justify-center [grid-area:top]">
          {topOpponent && (
            <OpponentSlot
              isActive={topOpponent.id === currentTurnPlayerId}
              orientation="top"
              player={topOpponent}
            />
          )}
        </div>

        {leftOpponent && (
          <div className="flex min-h-[22rem] items-center justify-center [grid-area:left] md:justify-start">
            <OpponentSlot
              isActive={leftOpponent.id === currentTurnPlayerId}
              orientation="left"
              player={leftOpponent}
            />
          </div>
        )}

        <div className="flex min-h-[20rem] items-center justify-center [grid-area:center]">
          <CenterPile
            currentColor={currentColor}
            currentTurnPlayerName={currentTurnPlayer.username}
            deckSize={deckSize}
            direction={direction}
            topCard={topCard}
          />
        </div>

        {rightOpponent && (
          <div className="flex min-h-[22rem] items-center justify-center [grid-area:right] md:justify-end">
            <OpponentSlot
              isActive={rightOpponent.id === currentTurnPlayerId}
              orientation="right"
              player={rightOpponent}
            />
          </div>
        )}

        <div className="flex items-end justify-center [grid-area:bottom]">
          <PlayerHand cards={currentPlayer.cards} player={currentPlayer} />
        </div>
      </div>
    </section>
  )
}

export default GameTable
