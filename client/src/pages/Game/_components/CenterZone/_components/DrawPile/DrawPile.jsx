import Card from '@/components/Card'

const DrawPile = ({ canDraw = true, deckSize, onDrawPileClick }) => {
  return (
    <div className="relative">
      <Card
        faceDown
        onClick={onDrawPileClick}
        playable={canDraw}
        aria-label="Draw a card"
      />
      <span className="sr-only">
        {`${deckSize} cards remaining in draw pile`}
      </span>
    </div>
  )
}

export default DrawPile
