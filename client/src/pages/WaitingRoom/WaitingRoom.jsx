import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getInitials from '@/utils/getInitials'
import WaitingRoomView from './_components/WaitingRoomView'

// Once a match forms, hold on "All players here", reveal the overlay after a
// beat, then hand off to the game table — mirrors the design's 1.3s + fade.
const OVERLAY_DELAY_MS = 1300
const NAVIGATE_DELAY_MS = 2900

const YOU_COLOR = 'bg-[#FFB04F]'
const OPPONENT_COLOR = 'bg-[#E03325]'

const WaitingRoom = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const match = useGameStore((state) => state.match)
  const rooms = useGameStore((state) => state.rooms)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)

  // Take a seat while this page is mounted. The server seats the player in
  // the open room — creating one if none exists, so the first to arrive owns
  // it — and starts the game once every seat is filled. The socket itself is
  // connected at the app level (App.jsx) and stays up across navigation, so
  // unmounting sends an explicit room:leave instead of disconnecting.
  // Leaving is safe after a match starts: the room is IN_GAME by then and
  // room:leave only unseats players from OPEN rooms.
  useEffect(() => {
    if (!token) return undefined
    const { seatRoom, leaveRoom, leaveLobby } = useGameStore.getState()
    seatRoom()
    return () => {
      leaveRoom()
      leaveLobby()
    }
  }, [token])

  // Match found: reveal the start overlay, then navigate to the game table.
  useEffect(() => {
    if (!match) return undefined
    const overlayTimer = setTimeout(
      () => setIsOverlayVisible(true),
      OVERLAY_DELAY_MS,
    )
    const navigateTimer = setTimeout(
      () => navigate(`/game?gameId=${match.gameId}`),
      NAVIGATE_DELAY_MS,
    )
    return () => {
      clearTimeout(overlayTimer)
      clearTimeout(navigateTimer)
    }
  }, [match, navigate])

  const handleLeaveRoom = () => {
    useGameStore.getState().leaveRoom()
    navigate('/lobby')
  }

  if (!user) return null

  const myRoom = rooms.find((room) =>
    room.players.some((player) => player.userId === user.id),
  )
  const you = {
    name: user.username,
    initials: getInitials(user.username),
    colorClass: YOU_COLOR,
  }
  // The opponent shows up as soon as they take their seat; once the match
  // starts, `match` carries the same identities.
  const opponentIdentity =
    match?.players.find((player) => player.userId !== user.id) ??
    myRoom?.players.find((player) => player.userId !== user.id)
  const opponent = opponentIdentity
    ? {
        name: opponentIdentity.username,
        initials: getInitials(opponentIdentity.username),
        colorClass: OPPONENT_COLOR,
      }
    : null

  return (
    <WaitingRoomView
      you={you}
      opponent={opponent}
      isMatched={Boolean(match)}
      isOverlayVisible={isOverlayVisible}
      onLeaveRoom={handleLeaveRoom}
    />
  )
}

export default WaitingRoom
