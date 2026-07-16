import RoomCard from './_components/RoomCard'

const RoomGrid = ({ rooms, onJoinRoom }) => {
  if (rooms.length === 0) {
    return (
      <p className="max-w-sm pt-10 text-center text-sm font-medium text-[#9A7050] sm:pt-16">
        No rooms yet. Create one and invite a friend to play.
      </p>
    )
  }

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onJoin={() => onJoinRoom(room.id)}
        />
      ))}
    </div>
  )
}

export default RoomGrid
