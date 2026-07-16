import Avatar from '@/components/Avatar'
import getPlayerIdentity from '@/utils/getPlayerIdentity'

// One opponent as a compact chip for the portrait table: avatar, name, and a
// live card count. Chips replace the desktop's scaled card-stack slots below
// md, where fanned card backs cost more space than they inform. The green
// ring mirrors the desktop slot's turn indicator.
const MobileOpponentChip = ({ isActive = false, player }) => {
  const identity = getPlayerIdentity(player)

  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-white/60 py-1 pr-3 pl-1 shadow-[0_1px_4px_rgba(0,0,0,0.08)] ${
        isActive
          ? 'shadow-[0_0_14px_2px_rgba(255,176,79,0.4)] ring-[3px] ring-[#4ADE80]'
          : ''
      }`}
    >
      <Avatar
        alt={`${player.username} avatar`}
        initials={identity.initials}
        size={32}
        src={player.avatarUrl || undefined}
      />
      <span className="max-w-24 truncate text-sm font-semibold text-black">
        {player.username}
      </span>
      <span className="text-sm font-black text-[#7a3810] tabular-nums">
        ×{player.cardCount}
      </span>
    </div>
  )
}

export default MobileOpponentChip
