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

  // Create opens the Quick Start picker to choose a room size; Join targets a
  // specific room. Both hand the seat off to the waiting room as navigation
  // intent rather than emitting it here: the waiting room owns seating so its
  // mount/cleanup cycle can't leave the room right after the lobby opened it.
  const handleCreateRoom = () => setIsQuickStartOpen(true)
  const handlePickSize = (size) =>
    navigate('/', { state: { seatIntent: { type: 'create', capacity: size } } })
  const handleJoinRoom = (roomId) =>
    navigate('/', { state: { seatIntent: { type: 'join', roomId } } })

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
