import { memo } from 'react'
import { bump } from '@/dev/renderCounter'
import OpponentAvatar from './_components/OpponentAvatar'
import OpponentCardStack from './_components/OpponentCardStack'

const SIDE_LAYOUTS = {
  left: 'flex-col items-center md:flex-row',
  right: 'flex-col items-center md:flex-row-reverse',
}

const OpponentSlot = ({ isActive = false, orientation = 'top', player }) => {
  bump('opponentSlot')
  const isTop = orientation.startsWith('top')
  const layoutClass = isTop
    ? 'flex-col items-center'
    : SIDE_LAYOUTS[orientation]
  const labelClass = isTop ? 'flex-row' : 'flex-row md:flex-col'

  return (
    <div className={`flex gap-4 ${layoutClass}`}>
      <div className={`flex shrink-0 items-center gap-3 ${labelClass}`}>
        <span
          className={`rounded-full p-1 ${isActive ? 'shadow-[0_0_22px_6px_rgba(255,176,79,0.35)] ring-4 ring-[#4ADE80]' : ''}`}
        >
          <OpponentAvatar player={player} />
        </span>
        <p className="text-center text-[28px] leading-none font-semibold text-black">
          {player.username}
        </p>
      </div>
      <OpponentCardStack orientation={orientation} player={player} />
    </div>
  )
}

// mapServerGameState rebuilds the `player` OBJECT every turn, so default memo
// never hits. Compare only the fields that change the rendered slot. cardCount
// and isActive are the load-bearing ones: without them an opponent drawing a
// card or the turn passing would not re-render.
const areEqual = (previous, next) =>
  previous.isActive === next.isActive &&
  previous.orientation === next.orientation &&
  previous.player.id === next.player.id &&
  previous.player.username === next.player.username &&
  previous.player.avatarUrl === next.player.avatarUrl &&
  previous.player.cardCount === next.player.cardCount

export default memo(OpponentSlot, areEqual)
