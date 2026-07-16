import { Check } from 'lucide-react'
import Avatar from '@/components/Avatar'

// Row fills from the design: the winner row washes orange, every other row
// sits on translucent white so the warm page surface shows through the card.
const SLOT_STATE_CLASSES = {
  winner: 'bg-[rgba(232,109,47,0.12)]',
  eliminated: 'bg-white/70',
  pending: 'bg-white/70',
  tbd: 'bg-white/70',
}

// One match card: two seat rows with avatar and name. Decided matches tint the
// winner's row and mark it with a check, and grey the eliminated player (the
// view model resolves slot.color, so this stays a pure presenter); empty seats
// read as TBD until the previous round feeds them.
const BracketMatch = ({ slots }) => {
  return (
    <div className="w-full divide-y divide-[rgba(0,0,0,0.07)] overflow-hidden rounded-[10px] border-[0.5px] border-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
      {slots.map((slot) => (
        <div
          key={slot.key}
          className={`flex min-h-[38px] items-center gap-2 px-2.5 py-[7px] ${SLOT_STATE_CLASSES[slot.state]}`}
        >
          {slot.state === 'tbd' ? (
            <span className="text-[11px] text-[#C9B8A8] italic">TBD</span>
          ) : (
            <>
              <Avatar
                alt={slot.name}
                className="text-[9px] font-bold shadow"
                color={slot.color}
                initials={slot.initials}
                size={24}
                src={slot.avatarUrl || undefined}
              />
              <span
                className={`flex-1 truncate text-xs font-semibold ${
                  slot.state === 'eliminated'
                    ? 'text-[#C9B8A8]'
                    : 'text-[#2A1A08]'
                }`}
              >
                {slot.name}
              </span>
              {slot.state === 'winner' ? (
                <>
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-[#E86D2F]"
                    strokeWidth={2.5}
                  />
                  <span className="sr-only">Winner</span>
                </>
              ) : null}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default BracketMatch
