// The seats in the waiting room, one per capacity. A filled seat shows the
// player's avatar (or their initials) with their display name below; an empty
// seat breathes while it waits. Two or three players sit in a single row; four
// fill a 2x2 grid. Anything larger falls back to two rows filled column by
// column.
const AVATAR_BASE =
  'flex h-16 w-16 items-center justify-center rounded-full text-base font-black tracking-[-0.03em] text-white shadow-[0_2px_12px_rgba(0,0,0,0.14)] sm:h-[72px] sm:w-[72px]'

const LAYOUT_BY_COUNT = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2',
}

const PlayerGrid = ({ slots }) => {
  const layout =
    LAYOUT_BY_COUNT[slots.length] ?? 'grid-flow-col grid-rows-2 auto-cols-max'

  return (
    <div className={`mb-8 grid gap-x-3 gap-y-3 sm:mb-11 sm:gap-x-4 ${layout}`}>
      {slots.map((slot, index) =>
        slot ? (
          <div key={slot.key} className="flex flex-col items-center gap-2">
            <div
              className={`${slot.isSelf ? '' : 'animate-wr-pop'} motion-reduce:animate-none ${AVATAR_BASE} ${slot.avatarUrl ? 'overflow-hidden' : slot.colorClass}`}
              role="img"
              aria-label={slot.name}
            >
              {slot.avatarUrl ? (
                <img
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                  src={slot.avatarUrl}
                />
              ) : (
                slot.initials
              )}
            </div>
            <span className="max-w-[88px] truncate text-xs font-bold text-[#2A1A08] sm:max-w-[96px] sm:text-sm">
              {slot.name}
            </span>
          </div>
        ) : (
          <div
            key={`empty-${index}`}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="animate-wr-breathe h-16 w-16 rounded-full border-[1.5px] border-dashed border-[rgba(0,0,0,0.18)] bg-[rgba(0,0,0,0.03)] motion-reduce:animate-none sm:h-[72px] sm:w-[72px]"
              role="img"
              aria-label="Waiting for a player"
            />
            <span className="text-xs font-medium text-[#2A1A08]/40 sm:text-sm">
              Waiting
            </span>
          </div>
        ),
      )}
    </div>
  )
}

export default PlayerGrid
