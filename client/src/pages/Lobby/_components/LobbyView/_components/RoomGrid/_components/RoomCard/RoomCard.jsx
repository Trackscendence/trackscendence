import StatusBadge from './_components/StatusBadge'
import SeatAvatars from './_components/SeatAvatars'

const RoomCard = ({ room, onJoin }) => {
  const isFull = room.players.length >= room.capacity
  const badgeVariant =
    room.status === 'IN_GAME' ? 'inGame' : isFull ? 'waiting' : 'open'
  const isJoinable = room.status === 'OPEN' && !isFull

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/65 p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2A1A08]">{room.name}</h2>
        <StatusBadge variant={badgeVariant} />
      </div>
      <p className="text-xs text-[#9A7050]">by {room.owner.username}</p>
      <div className="flex flex-col gap-2">
        <SeatAvatars players={room.players} capacity={room.capacity} />
        <p className="text-xs text-[#9A7050]">
          {room.players.length} of {room.capacity} players joined
        </p>
      </div>
      {isJoinable ? (
        <button
          type="button"
          onClick={onJoin}
          className="rounded-[14px] border border-[#C8956A] py-2 text-sm font-semibold text-[#6A4A20] transition hover:bg-[rgba(200,149,106,0.1)]"
        >
          Join Room
        </button>
      ) : null}
    </article>
  )
}

export default RoomCard
