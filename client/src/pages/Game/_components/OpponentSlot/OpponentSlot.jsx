import OpponentAvatar from './_components/OpponentAvatar'
import OpponentCardStack from './_components/OpponentCardStack'

const SIDE_LAYOUTS = {
  left: 'flex-col items-center md:flex-row',
  right: 'flex-col items-center md:flex-row-reverse',
}

const OpponentSlot = ({ isActive = false, orientation = 'top', player }) => {
  const isTop = orientation.startsWith('top')
  const layoutClass = isTop
    ? 'flex-col items-center'
    : SIDE_LAYOUTS[orientation]
  const labelClass = isTop ? 'flex-row' : 'flex-row md:flex-col'

  return (
    <div className={`flex gap-4 ${layoutClass}`}>
      <div className={`flex shrink-0 items-center gap-3 ${labelClass}`}>
        <span
          className={`rounded-full p-1 ${isActive ? 'ring-4 ring-[#EA5A2A]/40' : ''}`}
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

export default OpponentSlot
