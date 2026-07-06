import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getInitials from '@/utils/getInitials'
import WaitingRoomView from './_components/WaitingRoomView'
import OwnerLeaveModal from './_components/OwnerLeaveModal'

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
  const roomClosed = useGameStore((state) => state.roomClosed)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  // Take a seat while this page is mounted. The server seats the player in
  // the open room — creating one if none exists, so the first to arrive owns
  // it — and starts the game once every seat is filled. The socket itself is
  // connected at the app level (App.jsx) and stays up across navigation, so
  // unmounting sends an explicit room:leave instead of disconnecting.
  // Leaving is safe after a match starts: the room is IN_GAME by then and
  // room:leave only unseats players from OPEN rooms.
  useEffect(() => {
    if (!token) return undefined
    const { seatRoom, leaveRoom, leaveLobby, setRoomClosed } =
      useGameStore.getState()
    // Clear any leftover close signal from a previous room before seating, so
    // a stale flag can't bounce this fresh visit straight back to the lobby.
    setRoomClosed(false)
    seatRoom()
    return () => {
      leaveRoom()
      leaveLobby()
    }
  }, [token])

  // The owner ended the room out from under this player (#221): hand back to
  // the lobby. The owner who pressed End is already navigating there.
  useEffect(() => {
    if (!roomClosed) return
    useGameStore.getState().setRoomClosed(false)
    navigate('/lobby')
  }, [roomClosed, navigate])

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

  if (!user) return null

  const myRoom = rooms.find((room) =>
    room.players.some((player) => player.userId === user.id),
  )
  // Owning the room unlocks the leave/end choice; everyone else just leaves.
  // Once a match starts the room is IN_GAME and the leave button is moot, so
  // the modal only ever matters while the room is still OPEN.
  const isOwner = myRoom?.owner.userId === user.id

  const leaveToLobby = () => {
    useGameStore.getState().leaveRoom()
    navigate('/lobby')
  }
  const endRoom = () => {
    useGameStore.getState().endRoom()
    navigate('/lobby')
  }
  const handleLeaveRoom = () => {
    if (isOwner && !match) {
      setIsLeaveModalOpen(true)
      return
    }
    leaveToLobby()
  }
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
    <>
      <WaitingRoomView
        you={you}
        opponent={opponent}
        isMatched={Boolean(match)}
        isOverlayVisible={isOverlayVisible}
        onLeaveRoom={handleLeaveRoom}
      />
      <OwnerLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeave={leaveToLobby}
        onEnd={endRoom}
      />
    </>
  )
}

export default WaitingRoom
