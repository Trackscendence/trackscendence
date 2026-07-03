import Card from '@/components/Card'

const DrawPile = ({ deckSize, onDrawPileClick }) => {
  return (
    <div className="relative">
      <Card
        faceDown
        onClick={onDrawPileClick}
        playable={deckSize > 0}
        aria-label="Draw a card"
      />
      <span className="sr-only">
        {`${deckSize} cards remaining in draw pile`}
      </span>
    </div>
  )
}

export default DrawPile
