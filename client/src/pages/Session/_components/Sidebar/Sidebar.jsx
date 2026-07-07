import RoomLabel from '../RoomLabel'
import CreateRoomForm from '../CreateRoomForm'

const getRoomsByType = (rooms, type) => {
  return rooms.filter((room) => room.type === type)
}

const Sidebar = ({
  activeRoomId,
  isSubmittingRoom,
  onCreateRoom,
  onSelectRoom,
  rooms,
}) => {
  const channelRooms = getRoomsByType(rooms, 'channel')
  const chatRooms = getRoomsByType(rooms, 'chat')
  const privateRooms = getRoomsByType(rooms, 'private')

  return (
    <aside className="border-b border-[#e1e6de] bg-white p-4 lg:border-r lg:border-b-0">
      <CreateRoomForm
        isSubmitting={isSubmittingRoom}
        onCreateRoom={onCreateRoom}
      />
      <ul>
        {channelRooms.map((room) => (
          <RoomLabel
            isActive={room.id === activeRoomId}
            key={room.id}
            onSelectRoom={onSelectRoom}
            room={room}
          />
        ))}
      </ul>
      <h2 className="mt-5 text-xs font-black tracking-[0.16em] text-[#617267] uppercase">
        Rooms
      </h2>
      <hr className="mt-2 border-[#e1e6de]" />
      {chatRooms.length === 0 ? (
        <p className="mt-3 text-sm font-medium text-[#617267]">No rooms yet</p>
      ) : null}
      <ul>
        {chatRooms.map((room) => (
          <RoomLabel
            isActive={room.id === activeRoomId}
            key={room.id}
            onSelectRoom={onSelectRoom}
            room={room}
          />
        ))}
      </ul>
      <h2 className="mt-5 text-xs font-black tracking-[0.16em] text-[#617267] uppercase">
        Friends
      </h2>
      <hr className="mt-2 border-[#e1e6de]" />
      {privateRooms.length === 0 ? (
        <p className="mt-3 text-sm font-medium text-[#617267]">
          No friends yet
        </p>
      ) : null}
      <ul>
        {privateRooms.map((room) => (
          <RoomLabel
            isActive={room.id === activeRoomId}
            key={room.id}
            onSelectRoom={onSelectRoom}
            room={room}
          />
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar
