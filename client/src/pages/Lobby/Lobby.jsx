import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import QuickStartModal from '@/components/QuickStartModal'
import LobbyView from './_components/LobbyView'

const Lobby = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const rooms = useGameStore((state) => state.rooms)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  // Create and Join hand the seat off to the waiting room as navigation intent
  // rather than emitting it here: the waiting room owns seating so its
  // mount/cleanup cycle can't leave the room right after the lobby opened it.
  const handleCreateRoom = () => setIsCreateModalOpen(true)
  const handlePickRoomSize = (capacity) => {
    setIsCreateModalOpen(false)
    navigate('/', { state: { seatIntent: { type: 'create', capacity } } })
  }
  const handleJoinRoom = (roomId) =>
    navigate('/', { state: { seatIntent: { type: 'join', roomId } } })

  if (!user) return null

  const identity = getPlayerIdentity(user)

  return (
    <>
      <LobbyView
        user={{
          username: user.username,
          displayName: identity.name,
          email: user.email,
          initials: identity.initials,
          avatarUrl: identity.avatarUrl,
        }}
        rooms={rooms}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
      <QuickStartModal
        isOpen={isCreateModalOpen}
        title="Create Room"
        description="Choose how many players this room holds. You will wait there until the seats fill."
        onPick={handlePickRoomSize}
        onCancel={() => setIsCreateModalOpen(false)}
      />
    </>
  )
}

export default Lobby
