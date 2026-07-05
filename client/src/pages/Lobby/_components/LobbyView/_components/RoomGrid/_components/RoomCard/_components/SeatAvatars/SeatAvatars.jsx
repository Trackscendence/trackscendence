import getInitials from '@/utils/getInitials'

// Seat colors cycle by position, mirroring the design's varied avatars.
const SEAT_COLORS = [
  'bg-[#E03325]',
  'bg-[#F4C745]',
  'bg-[#51AFF1]',
  'bg-[#489E52]',
  'bg-[#FFB04F]',
  'bg-[#384E88]',
]

/**
 * Renders one circle per seat: filled seats show the player's initials, empty
 * seats a dashed placeholder. Rows follow the design: rooms of up to 3 seats
 * sit on one row, larger rooms split into two rows.
 */
const SeatAvatars = ({ players, capacity }) => {
  const columns = capacity <= 3 ? capacity : Math.ceil(capacity / 2)
  const seats = Array.from(
    { length: capacity },
    (_, seatIndex) => players[seatIndex] ?? null,
  )

  return (
    <div
      className="grid w-fit gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, 56px)` }}
    >
      {seats.map((player, seatIndex) =>
        player ? (
          <div
            key={player.userId}
            role="img"
            aria-label={player.username}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${SEAT_COLORS[seatIndex % SEAT_COLORS.length]}`}
          >
            {getInitials(player.username)}
          </div>
        ) : (
          <div
            key={`empty-seat-${seatIndex}`}
            aria-hidden="true"
            className="h-14 w-14 rounded-full border-2 border-dashed border-black/[0.18] bg-black/[0.04]"
          />
        ),
      )}
    </div>
  )
}

export default SeatAvatars
