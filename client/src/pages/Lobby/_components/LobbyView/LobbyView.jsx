import Layout from '@/layouts/Layout'
import PlayHeading from './_components/PlayHeading'
import RoomGrid from './_components/RoomGrid'

const LobbyView = ({ rooms, onJoinRoom }) => {
  return (
    <Layout>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <PlayHeading />
        <div className="flex justify-center pt-6 sm:pt-8">
          <RoomGrid rooms={rooms} onJoinRoom={onJoinRoom} />
        </div>
      </main>
    </Layout>
  )
}

export default LobbyView
