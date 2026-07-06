import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getInitials from '@/utils/getInitials'
import QuickStartModal from '@/components/QuickStartModal'
import LobbyView from './_components/LobbyView'

const Lobby = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const rooms = useGameStore((state) => state.rooms)
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false)

  // Hydrate the room list; later changes arrive via the server's
  // `rooms_update` broadcasts. The socket itself is connected at the app
  // level (App.jsx) and Socket.IO buffers the emit if the connection is
  // still being established. Lobby viewers are not seated in a room, so
  // nothing needs to be undone on unmount.
  useEffect(() => {
    if (!token) return undefined
    useGameStore.getState().listRooms()
    return undefined
  }, [token])

  // Create opens the Quick Start picker to choose a room size, then seats the
  // player as its owner and heads to the waiting room. Join seats the player
  // into the chosen room and does the same.
  const handleCreateRoom = () => setIsQuickStartOpen(true)
  const handlePickSize = (size) => {
    useGameStore.getState().seatRoom(size)
    navigate('/')
  }
  const handleJoinRoom = (roomId) => {
    useGameStore.getState().joinRoomById(roomId)
    navigate('/')
  }

  if (!user) return null

  const hasOpenRoom = rooms.some((room) => room.status === 'OPEN')

  return (
    <>
      <LobbyView
        user={{
          username: user.username,
          email: user.email,
          initials: getInitials(user.username),
        }}
        rooms={rooms}
        canCreateRoom={!hasOpenRoom}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
      <QuickStartModal
        isOpen={isQuickStartOpen}
        onPick={handlePickSize}
        onCancel={() => setIsQuickStartOpen(false)}
      />
    </>
  )
}

export default Lobby
