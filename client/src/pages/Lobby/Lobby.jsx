import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getInitials from '@/utils/getInitials'
import LobbyView from './_components/LobbyView'

const Lobby = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const rooms = useGameStore((state) => state.rooms)

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

  // Create and Join both enter the waiting room, where auto-seat puts the
  // player in the open room or creates one — so the first to enter owns it.
  // Create is only offered while no room is open; everyone else can just join.
  const handleEnterRoom = () => navigate('/')

  if (!user) return null

  const hasOpenRoom = rooms.some((room) => room.status === 'OPEN')

  return (
    <LobbyView
      user={{
        username: user.username,
        email: user.email,
        initials: getInitials(user.username),
      }}
      rooms={rooms}
      canCreateRoom={!hasOpenRoom}
      onCreateRoom={handleEnterRoom}
      onJoinRoom={handleEnterRoom}
    />
  )
}

export default Lobby
