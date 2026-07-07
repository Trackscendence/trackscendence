const RoomLabel = ({ isActive, onSelectRoom, room }) => {
  return (
    <li>
      <button
        className={`mt-2 flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-sm font-semibold transition ${
          isActive
            ? 'bg-[#58947C] text-white'
            : 'bg-[#D9E7E0] text-[#1f2b24] hover:bg-[#B4CFC3]'
        }`}
        onClick={() => onSelectRoom(room.id)}
        type="button"
      >
        {room.type === 'private' ? (
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-[#2f7d61]"
          />
        ) : null}
        <span>{room.name}</span>
      </button>
    </li>
  )
}

export default RoomLabel
