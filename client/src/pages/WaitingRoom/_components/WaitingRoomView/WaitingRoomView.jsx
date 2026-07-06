import WaitingHeadline from './_components/WaitingHeadline'
import StatusLine from './_components/StatusLine'
import PlayerGrid from './_components/PlayerGrid'
import LeaveRoomButton from './_components/LeaveRoomButton'
import GameStartOverlay from './_components/GameStartOverlay'

const WaitingRoomView = ({
  slots,
  isMatched,
  neededMore,
  isOverlayVisible,
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
        <LeaveRoomButton onClick={onLeaveRoom} />
      </main>
      {isOverlayVisible ? <GameStartOverlay /> : null}
    </div>
  )
}

export default WaitingRoomView
