import Card from '@/components/Card'

const DiscardPile = ({ pendingDraw = 0, topCard }) => {
  return (
    <div className="relative">
      <Card
        {...topCard}
        className="cursor-default"
        playable={false}
        tabIndex={-1}
      />
      {pendingDraw > 0 && (
        <span className="sr-only">{`Pending draw is ${pendingDraw}`}</span>
      )}
    </div>
  )
}

export default DiscardPile
