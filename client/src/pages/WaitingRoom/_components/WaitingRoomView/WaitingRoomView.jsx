import WaitingHeadline from './_components/WaitingHeadline'
import StatusLine from './_components/StatusLine'
import PlayerGrid from './_components/PlayerGrid'
import FillSeatsButton from './_components/FillSeatsButton'
import LeaveRoomButton from './_components/LeaveRoomButton'
import GameStartOverlay from './_components/GameStartOverlay'

const WaitingRoomView = ({
  slots,
  isMatched,
  neededMore,
  canFillWithBots,
  isOverlayVisible,
  onFillWithBots,
  onLeaveRoom,
}) => {
  return (
    <div className="bg-surface-waiting flex h-screen flex-col overflow-hidden">
      <main className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mb-12 flex flex-col items-center">
          <WaitingHeadline />
          <StatusLine isMatched={isMatched} neededMore={neededMore} />
        </div>
        <PlayerGrid slots={slots} />
        <div className="flex flex-wrap items-center justify-center gap-3">
          {canFillWithBots ? (
            <FillSeatsButton onClick={onFillWithBots} />
          ) : null}
          <LeaveRoomButton onClick={onLeaveRoom} />
        </div>
      </main>
      {isOverlayVisible ? <GameStartOverlay /> : null}
    </div>
  )
}

export default WaitingRoomView
