import Avatar from '@/components/Avatar'

const STATUS_TEXT_CLASSES = {
  champion: 'text-[#E86D2F]',
  eliminated: 'text-[#C9B8A8]',
  active: 'text-[#9A7050]',
}

// The content of a bracket row's hover card: the player's avatar in their
// bracket colour, their name, and the seed/status line the view model already
// wrote (slot.description). Everything comes from the bracket payload — no
// requests fire on hover.
const BracketPlayerCard = ({ slot }) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        alt=""
        className="text-[9px] font-bold"
        color={slot.color}
        initials={slot.initials}
        size={24}
        src={slot.avatarUrl || undefined}
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-[#2A1A08]">{slot.name}</p>
        <p
          className={`text-[11px] ${STATUS_TEXT_CLASSES[slot.tournamentStatus]}`}
        >
          {slot.description}
        </p>
      </div>
    </div>
  )
}

export default BracketPlayerCard
