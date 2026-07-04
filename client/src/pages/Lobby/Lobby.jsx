import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import useSocketStore from '@/stores/useSocketStore'
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

  // Connect the socket, register game listeners, and join the queue. The server
  // auto-queues on `join_lobby` and starts the game once two players are in.
  useEffect(() => {
    if (!token) return undefined
    const { connect, disconnect } = useSocketStore.getState()
    const { joinLobby, leaveLobby } = useGameStore.getState()
    connect(token)
    joinLobby()
    return () => {
      leaveLobby()
      disconnect()
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
  // login, so there is nowhere else to go back to in the MVP flow. Disconnecting
  // the socket drops the player from the server queue.
  const handleLeaveQueue = async () => {
    useSocketStore.getState().disconnect()
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
