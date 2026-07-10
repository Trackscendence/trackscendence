import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import QuickStartModal from '@/components/QuickStartModal'
import LobbyView from './_components/LobbyView'

const Lobby = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const rooms = useGameStore((state) => state.rooms)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Watch room-list broadcasts and hydrate the current list. The socket is
  // connected at the app level (App.jsx) and Socket.IO buffers the emits if the
  // connection is still being established. Lobby viewers are not seated in a
  // room; the only thing to undo on unmount is the broadcast subscription, so a
  // socket that leaves the room grid stops receiving `rooms_update` (audit B5).
  useEffect(() => {
    if (!token) return undefined
    const { watchRooms, listRooms, unwatchRooms } = useGameStore.getState()
    watchRooms()
    listRooms()
    return () => unwatchRooms()
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

  return (
    <>
      <LobbyView
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
