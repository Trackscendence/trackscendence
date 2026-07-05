import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import WaitingRoomView from './_components/WaitingRoomView'
import getInitials from './_utils/getInitials'

// Once a match forms, hold on "All players here", reveal the overlay after a
// beat, then hand off to the game table — mirrors the design's 1.3s + fade.
const OVERLAY_DELAY_MS = 1300
const NAVIGATE_DELAY_MS = 2900

const YOU_COLOR = 'bg-[#FFB04F]'
const OPPONENT_COLOR = 'bg-[#E03325]'

const Lobby = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const match = useGameStore((state) => state.match)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)

  // Join the matchmaking queue while this page is mounted. The socket itself
  // is connected at the app level (App.jsx) and stays up across navigation —
  // Socket.IO buffers the emit if the connection is still being established.
  // Leaving the queue on unmount is safe after a match starts: the server has
  // already moved both players out of the lobby by then.
  useEffect(() => {
    if (!token) return undefined
    const { joinLobby, leaveLobby } = useGameStore.getState()
    joinLobby()
    return () => {
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

  // Leaving the queue logs out: the waiting room is the first screen after
  // login, so there is nowhere else to go back to in the MVP flow. Logout
  // clears the token, which makes the app-level socket effect disconnect and
  // drop us from the server queue.
  const handleLeaveQueue = async () => {
    await useAuthStore.getState().logout()
    navigate('/login')
  }

  if (!user) return null

  const you = {
    name: user.username,
    initials: getInitials(user.username),
    colorClass: YOU_COLOR,
  }
  const opponentIdentity = match?.players.find(
    (player) => player.userId !== user.id,
  )
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
      onLeaveQueue={handleLeaveQueue}
    />
  )
}

export default Lobby
