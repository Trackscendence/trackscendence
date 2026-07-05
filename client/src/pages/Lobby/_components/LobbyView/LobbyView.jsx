import LobbyNav from './_components/LobbyNav'
import PlayHeading from './_components/PlayHeading'
import RoomGrid from './_components/RoomGrid'

const LobbyView = ({
  user,
  rooms,
  canCreateRoom,
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div className="bg-surface-warm flex min-h-screen flex-col">
      <LobbyNav
        user={user}
        canCreateRoom={canCreateRoom}
        onCreateRoom={onCreateRoom}
      />
      <main className="flex flex-1 flex-col px-8 py-8">
        <PlayHeading />
        <div className="flex justify-center pt-8">
          <RoomGrid rooms={rooms} onJoinRoom={onJoinRoom} />
        </div>
      </main>
    </div>
  )
}

export default LobbyView
