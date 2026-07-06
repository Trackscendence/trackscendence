// The seats in the waiting room, one per capacity. A filled seat shows the
// player's initials; an empty seat breathes while it waits. Two players sit
// side by side; three or more fill column by column across two rows (slot 1
// top-left, slot 2 bottom-left, slot 3 top-right, and so on).
const AVATAR_BASE =
  'flex h-[72px] w-[72px] items-center justify-center rounded-full text-base font-black tracking-[-0.03em] text-white shadow-[0_2px_12px_rgba(0,0,0,0.14)]'

const PlayerGrid = ({ slots }) => {
  const layout =
    slots.length <= 2
      ? 'grid-cols-2'
      : 'grid-flow-col grid-rows-2 auto-cols-max'

  return (
    <div className={`mb-11 grid gap-4 ${layout}`}>
      {slots.map((slot, index) =>
        slot ? (
          <div
            key={slot.key}
            className={`${slot.isSelf ? '' : 'animate-wr-pop'} motion-reduce:animate-none ${AVATAR_BASE} ${slot.colorClass}`}
            role="img"
            aria-label={slot.name}
          >
            {slot.initials}
          </div>
        ) : (
          <div
            key={`empty-${index}`}
            className="animate-wr-breathe h-[72px] w-[72px] rounded-full border-[1.5px] border-dashed border-[rgba(0,0,0,0.18)] bg-[rgba(0,0,0,0.03)] motion-reduce:animate-none"
            role="img"
            aria-label="Waiting for a player"
          />
        ),
      )}
    </div>
  )
}

export default PlayerGrid
