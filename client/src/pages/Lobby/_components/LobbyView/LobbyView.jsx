import AppHeader from '@/components/AppHeader'
import PlayHeading from './_components/PlayHeading'
import RoomGrid from './_components/RoomGrid'

const LobbyView = ({ rooms, onJoinRoom }) => {
  return (
    <div className="bg-surface-warm flex min-h-screen flex-col">
      <AppHeader />
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
