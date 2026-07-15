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
    <div className="bg-surface-waiting flex min-h-[100dvh] flex-col overflow-hidden">
      <main className="flex flex-1 flex-col items-center justify-between gap-8 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mt-2 flex flex-col items-center">
          <WaitingHeadline />
          <StatusLine isMatched={isMatched} neededMore={neededMore} />
        </div>
        <PlayerGrid slots={slots} />
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
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
