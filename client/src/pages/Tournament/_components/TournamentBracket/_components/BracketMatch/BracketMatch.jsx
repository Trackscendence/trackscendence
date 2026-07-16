import { Check } from 'lucide-react'
import Avatar from '@/components/Avatar'
import HoverCard from '@/components/HoverCard'
import ProfileLink from '@/components/ProfileLink'
import BracketPlayerCard from './_components/BracketPlayerCard'

// Row fills from the design: the winner row washes orange, every other row
// sits on translucent white so the warm page surface shows through the card.
const SLOT_STATE_CLASSES = {
  winner: 'bg-[rgba(232,109,47,0.12)]',
  eliminated: 'bg-white/70',
  pending: 'bg-white/70',
  tbd: 'bg-white/70',
}

// The card cannot use overflow-hidden to clip its rows to the radius (that
// would also clip the floating hover card), so the first and last rows round
// their own outer corners instead. The white hairline is an outer shadow
// ring rather than a real border: a border insets the row curve by its own
// width and the radius mismatch leaves an unpainted fringe at each corner.
const ROW_CLASSES = 'flex min-h-[38px] items-center gap-2 px-2.5 py-[7px]'

const ROW_CORNER_CLASSES = 'first:rounded-t-[10px] last:rounded-b-[10px]'

// One match card: two seat rows with avatar and name. A filled row links to
// the player's profile and floats a BracketPlayerCard while hovered or
// focused; the same seed/status line rides along as visually hidden link text
// for screen readers. Decided matches tint the winner's row and grey the
// eliminated player (the view model resolves slot.color, so this stays a pure
// presenter); empty seats read as TBD until the previous round feeds them.
const BracketMatch = ({ slots }) => {
  return (
    <div className="w-full divide-y divide-[rgba(0,0,0,0.07)] rounded-[10px] shadow-[0_0_0_0.5px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.06)]">
      {slots.map((slot) =>
        slot.state === 'tbd' ? (
          <div
            key={slot.key}
            className={`${ROW_CLASSES} ${ROW_CORNER_CLASSES} ${SLOT_STATE_CLASSES.tbd}`}
          >
            <span className="text-[11px] text-[#C9B8A8] italic">TBD</span>
          </div>
        ) : (
          <HoverCard
            key={slot.key}
            className={`${ROW_CORNER_CLASSES} ${SLOT_STATE_CLASSES[slot.state]}`}
            content={<BracketPlayerCard slot={slot} />}
          >
            <ProfileLink
              className={`${ROW_CLASSES} focus-visible:ring-2 focus-visible:ring-[#E86D2F]/50 focus-visible:outline-none focus-visible:ring-inset`}
              username={slot.name}
            >
              <Avatar
                alt=""
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
              <span className="sr-only">, {slot.description}</span>
              {slot.state === 'winner' ? (
                <>
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-[#E86D2F]"
                    strokeWidth={2.5}
                  />
                  <span className="sr-only">, winner of this match</span>
                </>
              ) : null}
            </ProfileLink>
          </HoverCard>
        ),
      )}
    </div>
  )
}

export default BracketMatch
