import { useCallback, useEffect, useRef, useState } from 'react'
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

  // Store actions are stable singleton refs, so they are safe useCallback deps.
  const { playCard, drawCard, passTurn, callUno, catchUno } =
    useGameStore.getState()

  // The `table` prop is a fresh object every turn. Read it through a ref so the
  // handlers below can stay referentially stable across turns (their identity
  // must not change, or the memoized Card/pile children re-render every update)
  // while still acting on the current hand at click time. The ref is synced in
  // an effect, not during render, so a click (which fires after paint) always
  // sees the latest table.
  const tableRef = useRef(table)
  useEffect(() => {
    tableRef.current = table
  })

  const handleCardClick = useCallback(
    (cardIndex) => {
      const card = tableRef.current.currentPlayer.cards[cardIndex]
      if (!card?.playable) return
      if (card.color === 'wild') {
        setPendingWildIndex(cardIndex)
        return
      }
      playCard(gameId, cardIndex, null)
    },
    [gameId, playCard],
  )

  const handleDrawPileClick = useCallback(
    () => drawCard(gameId),
    [drawCard, gameId],
  )
  const handlePassClick = useCallback(
    () => passTurn(gameId),
    [passTurn, gameId],
  )
  const handleCallUno = useCallback(() => callUno(gameId), [callUno, gameId])
  const handleCatchUno = useCallback(
    (targetUserId) => catchUno(gameId, targetUserId),
    [catchUno, gameId],
  )

  const handleColorPick = (declaredColor) => {
    playCard(gameId, pendingWildIndex, declaredColor)
    setPendingWildIndex(null)
  }

  return (
    <>
      <GameTable
        {...table}
        onCallUno={handleCallUno}
        onCardClick={handleCardClick}
        onCatchUno={handleCatchUno}
        onDrawPileClick={handleDrawPileClick}
        onPassClick={handlePassClick}
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
