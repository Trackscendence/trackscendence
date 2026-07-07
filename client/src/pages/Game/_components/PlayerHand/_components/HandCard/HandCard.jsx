import { memo } from 'react'
import Card from '@/components/Card'

// One own-hand card. Receives the card's fields spread as PRIMITIVES plus its
// fixed hand position, so default shallow memo hits and an unchanged card is
// skipped on a game_state_update that did not touch it — no re-render, and the
// onClick closure below is not even recreated. The closure is safe to rebuild
// on the rare render because onCardClick is a stable useCallback (LiveGameTable)
// and cardPosition is a plain number.
const HandCard = ({ cardPosition, onCardClick, ...card }) => {
  const handleClick = onCardClick ? () => onCardClick(cardPosition) : undefined
  return <Card {...card} onClick={handleClick} />
}

export default memo(HandCard)
