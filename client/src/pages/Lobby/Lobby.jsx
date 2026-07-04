import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import WaitingRoomView from './_components/WaitingRoomView'
import getInitials from './_utils/getInitials'

// Once both players are in, hold on "All players here", reveal the overlay after
// a beat, then hand off to the game table — mirrors the design's 1.3s + fade.
const OVERLAY_DELAY_MS = 1300
const NAVIGATE_DELAY_MS = 2900

const YOU_COLOR = 'bg-[#FFB04F]'
const OPPONENT_COLOR = 'bg-[#E03325]'

const Lobby = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const gameState = useGameStore((state) => state.gameState)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)

  useEffect(() => {
    if (!user) return undefined
    const { joinLobby, leaveLobby } = useGameStore.getState()
    joinLobby({ id: user.id, username: user.username })
    return () => leaveLobby()
  }, [user])

  useEffect(() => {
    if (!gameState) return undefined
    const overlayTimer = setTimeout(
      () => setIsOverlayVisible(true),
      OVERLAY_DELAY_MS,
    )
    const navigateTimer = setTimeout(
      () => navigate(`/game?gameId=${gameState.gameId}`),
      NAVIGATE_DELAY_MS,
    )
    return () => {
      clearTimeout(overlayTimer)
      clearTimeout(navigateTimer)
    }
  }, [gameState, navigate])

  if (!user) return null

  const you = {
    name: user.username,
    initials: getInitials(user.username),
    colorClass: YOU_COLOR,
  }
  const opponentIdentity = gameState?.players.find(
    (player) => player.userId !== (user.id ?? 'me'),
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
      isMatched={Boolean(gameState)}
      isOverlayVisible={isOverlayVisible}
    />
  )
}

export default Lobby
