import WaitingHeadline from './_components/WaitingHeadline'
import StatusLine from './_components/StatusLine'
import PlayerList from './_components/PlayerList'
import LeaveQueueButton from './_components/LeaveQueueButton'
import GameStartOverlay from './_components/GameStartOverlay'

const WaitingRoomView = ({
  you,
  opponent,
  isMatched,
  isOverlayVisible,
  onLeaveQueue,
}) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FDE8CF]">
      <main className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mb-12 flex flex-col items-center">
          <WaitingHeadline />
          <StatusLine isMatched={isMatched} />
        </div>
        <PlayerList you={you} opponent={opponent} />
        <LeaveQueueButton onClick={onLeaveQueue} />
      </main>
      {isOverlayVisible ? <GameStartOverlay /> : null}
    </div>
  )
}

export default WaitingRoomView
