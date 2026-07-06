import { useState } from 'react'
import useGameStore from '@/stores/useGameStore'
import GameTable from '../GameTable'
import WildColorPicker from '../WildColorPicker'

// Interactive half of the live game: turns table clicks into game:* socket
// emits. The server stays authoritative — nothing here touches the hand or
// the turn; every click waits for the next game_state_update (an illegal or
// stale move comes back as a game_error toast instead).

const LiveGameTable = ({ gameId, table }) => {
  // Index of a clicked wild card while its color picker is open. Wilds are
  // the only two-step move; everything else emits on the first click.
  const [pendingWildIndex, setPendingWildIndex] = useState(null)

  const { playCard, drawCard, passTurn } = useGameStore.getState()

  const handleCardClick = (cardIndex) => {
    const card = table.currentPlayer.cards[cardIndex]
    if (!card?.playable) return
    if (card.color === 'wild') {
      setPendingWildIndex(cardIndex)
      return
    }
    playCard(gameId, cardIndex, null)
  }

  const handleColorPick = (declaredColor) => {
    playCard(gameId, pendingWildIndex, declaredColor)
    setPendingWildIndex(null)
  }

  return (
    <>
      <GameTable
        {...table}
        onCardClick={handleCardClick}
        onDrawPileClick={() => drawCard(gameId)}
        onPassClick={() => passTurn(gameId)}
        onUnoClick={() => undefined}
      />
      {pendingWildIndex !== null && (
        <WildColorPicker
          onCancel={() => setPendingWildIndex(null)}
          onPick={handleColorPick}
        />
      )}
    </>
  )
}

export default LiveGameTable
