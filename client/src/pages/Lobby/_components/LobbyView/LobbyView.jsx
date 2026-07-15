import AppHeader from '@/components/AppHeader'
import PlayHeading from './_components/PlayHeading'
import RoomGrid from './_components/RoomGrid'

const LobbyView = ({ rooms, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="bg-surface-warm flex min-h-[100dvh] flex-col">
      <AppHeader onCreateRoom={onCreateRoom} />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <PlayHeading />
        <div className="flex justify-center pt-6 sm:pt-8">
          <RoomGrid rooms={rooms} onJoinRoom={onJoinRoom} />
        </div>
      </main>
    </div>
  )
}

export default LobbyView
