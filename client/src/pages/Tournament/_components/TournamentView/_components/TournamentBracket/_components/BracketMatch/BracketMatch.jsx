import { Check } from 'lucide-react'
import Avatar from '@/components/Avatar'

const SLOT_STATE_CLASSES = {
  winner: 'bg-[#fbe3cd]',
  eliminated: 'opacity-50',
  pending: '',
  tbd: '',
}

// One match card: two seat rows with avatar and name. Decided matches
// highlight the winner (fill + check) and dim the eliminated player; empty
// seats read as TBD until the previous round feeds them.
const BracketMatch = ({ slots }) => {
  return (
    <div className="divide-y divide-[#f3e3cd] overflow-hidden rounded-2xl bg-white shadow-sm">
      {slots.map((slot) => (
        <div
          key={slot.key}
          className={`flex min-h-12 items-center gap-3 px-4 py-2.5 ${SLOT_STATE_CLASSES[slot.state]}`}
        >
          {slot.state === 'tbd' ? (
            <span className="text-sm text-[#b3a18c] italic">TBD</span>
          ) : (
            <>
              <Avatar
                alt={slot.name}
                initials={slot.initials}
                size={32}
                src={slot.avatarUrl || undefined}
              />
              <span className="flex-1 text-sm font-semibold text-[#2E2D2D]">
                {slot.name}
              </span>
              {slot.state === 'winner' ? (
                <>
                  <Check
                    aria-hidden="true"
                    className="h-4 w-4 text-[#E86D2F]"
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
