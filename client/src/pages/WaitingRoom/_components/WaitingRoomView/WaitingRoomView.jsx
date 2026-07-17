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
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Phones pin the headline up top and the actions in the bottom thumb
          zone; from sm up the whole group is vertically centered as designed. */}
      <main className="flex flex-1 flex-col items-center justify-between gap-8 px-4 py-6 sm:justify-center sm:gap-0 sm:px-8 sm:py-0">
        <div className="mt-2 flex flex-col items-center sm:mt-0 sm:mb-12">
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
