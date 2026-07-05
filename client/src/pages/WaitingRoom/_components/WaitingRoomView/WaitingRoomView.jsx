import WaitingHeadline from './_components/WaitingHeadline'
import StatusLine from './_components/StatusLine'
import PlayerList from './_components/PlayerList'
import LeaveRoomButton from './_components/LeaveRoomButton'
import GameStartOverlay from './_components/GameStartOverlay'

const WaitingRoomView = ({
  you,
  opponent,
  isMatched,
  isOverlayVisible,
  onLeaveRoom,
}) => {
  return (
    <div className="bg-surface-waiting flex h-screen flex-col overflow-hidden">
      <main className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mb-12 flex flex-col items-center">
          <WaitingHeadline />
          <StatusLine isMatched={isMatched} />
        </div>
        <PlayerList you={you} opponent={opponent} />
        <LeaveRoomButton onClick={onLeaveRoom} />
      </main>
      {isOverlayVisible ? <GameStartOverlay /> : null}
    </div>
  )
}

export default WaitingRoomView
