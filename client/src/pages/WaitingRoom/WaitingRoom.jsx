import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import LoadingSpinner from '@/components/LoadingSpinner'
import QuickStartModal from '@/components/QuickStartModal'
import WaitingRoomView from './_components/WaitingRoomView'
import OwnerLeaveModal from './_components/OwnerLeaveModal'
import {
  cancelDeferredRoomExit,
  scheduleDeferredRoomExit,
} from './_utils/deferredRoomExit'
import {
  getRoomClosedAction,
  ROOM_CLOSED_ACTIONS,
} from './_utils/roomClosedAction'
import { claimSeatIntent, getSeatIntentKey } from './_utils/seatIntent'

// Once a match forms, hold on "All players here", reveal the overlay after a
// beat, then hand off to the game table — mirrors the design's 1.3s + fade.
const OVERLAY_DELAY_MS = 1300
const NAVIGATE_DELAY_MS = 2900
// A short beat for the room list to hydrate before deciding to auto-join or
// offer Quick Start, so the modal never flashes ahead of a rooms_update.
const ROOM_DECIDE_MS = 700

const YOU_COLOR = 'bg-[#FFB04F]'
const OTHER_COLOR = 'bg-[#E03325]'

const WaitingRoom = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // Set by the lobby's Create/Join buttons: seat the player as soon as this
  // page mounts instead of letting the decide timer offer Quick Start.
  const seatIntent = location.state?.seatIntent
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const match = useGameStore((state) => state.match)
  const rooms = useGameStore((state) => state.rooms)
  const roomClosed = useGameStore((state) => state.roomClosed)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const leaveTimerRef = useRef(null)
  const seatIntentKey = getSeatIntentKey(seatIntent)
  // 'deciding' while the room list loads, then 'choosing' (Quick Start) when no
  // room is open. Once seated, the room itself drives the view.
  const [phase, setPhase] = useState('deciding')
  const myRoom = user
    ? rooms.find((room) =>
        room.players.some((player) => player.userId === user.id),
      )
    : null

  // The room flow (#154/#273). Two ways in: with a seat intent from the
  // lobby's Create/Join, we seat the player straight away; on a direct arrival
  // (post-login) we join an open room if there is one, otherwise offer Quick
  // Start so the first player opens one. The socket is app-owned and stays up
  // across navigation, so unmounting sends an explicit room:leave rather than
  // disconnecting.
  useEffect(() => {
    if (!token) return undefined
    const {
      listRooms,
      watchRooms,
      unwatchRooms,
      leaveRoom,
      leaveLobby,
      setRoomClosed,
      createRoom,
      joinRoomById,
    } = useGameStore.getState()
    cancelDeferredRoomExit({ timerRef: leaveTimerRef })
    setRoomClosed(null)
    watchRooms()
    listRooms()
    // Arriving from the lobby with an explicit intent: emit the seat here so
    // it survives this effect's mount/cleanup/remount (StrictMode) — the
    // cleanup's room:leave would otherwise undo a seat emitted by the lobby.
    // The reactive `rooms` then renders the room once the server confirms it,
    // so there is no decide timer and Quick Start never shows.
    const hasSeatIntent = Boolean(seatIntentKey)
    if (hasSeatIntent && claimSeatIntent(seatIntent, location.key)) {
      if (seatIntent.type === 'join') joinRoomById(seatIntent.roomId)
      else createRoom(seatIntent.capacity)
    }
    // Direct arrival (post-login): decide for ourselves after a short beat.
    // Auto-join a room if one is available, or offer Quick Start to open one.
    const decideTimer = hasSeatIntent
      ? null
      : setTimeout(() => {
          const state = useGameStore.getState()
          const ownId = useAuthStore.getState().user?.id
          const seated = state.rooms.some((room) =>
            room.players.some((player) => player.userId === ownId),
          )
          if (seated) {
            setPhase('seated')
            return
          }
          const openRoom = state.rooms.find(
            (room) =>
              room.status === 'OPEN' && room.players.length < room.capacity,
          )
          if (openRoom) {
            state.seatRoom()
            setPhase('seated')
          } else {
            setPhase('choosing')
          }
        }, ROOM_DECIDE_MS)
    return () => {
      if (decideTimer) clearTimeout(decideTimer)
      unwatchRooms()
      scheduleDeferredRoomExit({
        timerRef: leaveTimerRef,
        leaveRoom,
        leaveLobby,
      })
    }
  }, [token, seatIntent, seatIntentKey, location.key])

  // The owner ended the room out from under this player (#221): hand back to
  // the lobby. The owner who pressed End is already navigating there.
  useEffect(() => {
    if (!roomClosed) return
    const action = getRoomClosedAction({
      closedRoomId: roomClosed,
      currentRoomId: myRoom?.id,
      seatIntent,
    })
    if (action === ROOM_CLOSED_ACTIONS.ignore) return

    useGameStore.getState().setRoomClosed(null)
    if (action === ROOM_CLOSED_ACTIONS.navigate) {
      navigate('/lobby')
    }
  }, [roomClosed, myRoom?.id, seatIntent, navigate])

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
  const handleQuickStart = (size) => {
    useGameStore.getState().createRoom(size)
    setPhase('seated')
  }
  const handleFillWithBots = () => {
    useGameStore.getState().fillRoomWithBots()
  }

  // Not seated yet: offer Quick Start once we know no room is open, otherwise
  // hold on the loader while the room list settles.
  if (!myRoom) {
    return (
      <div className="bg-surface-waiting flex h-screen flex-col items-center justify-center">
        {phase === 'choosing' ? (
          <QuickStartModal
            isOpen
            onPick={handleQuickStart}
            onCancel={() => navigate('/lobby')}
          />
        ) : (
          <LoadingSpinner
            className="bg-surface-waiting text-[#3d1200]"
            heading="Finding a room"
            message="Dealing you in…"
          />
        )}
      </div>
    )
  }

  // Build the seats: you first (gold), the rest red, padded to capacity so the
  // empty seats show as breathing placeholders.
  const otherPlayers = myRoom.players.filter(
    (player) => player.userId !== user.id,
  )
  const selfIdentity = getPlayerIdentity(user)
  const slots = [
    {
      key: `p-${user.id}`,
      name: selfIdentity.name,
      initials: selfIdentity.initials,
      avatarUrl: selfIdentity.avatarUrl,
      colorClass: YOU_COLOR,
      isSelf: true,
    },
    ...otherPlayers.map((player) => {
      const identity = getPlayerIdentity(player)
      return {
        key: `p-${player.userId}`,
        name: identity.name,
        initials: identity.initials,
        avatarUrl: identity.avatarUrl,
        colorClass: OTHER_COLOR,
      }
    }),
  ]
  while (slots.length < myRoom.capacity) slots.push(null)

  const neededMore = Math.max(0, myRoom.capacity - myRoom.players.length)
  const isMatched = Boolean(match) || myRoom.players.length >= myRoom.capacity

  return (
    <>
      <WaitingRoomView
        slots={slots}
        isMatched={isMatched}
        neededMore={neededMore}
        canFillWithBots={isOwner && neededMore > 0 && !isMatched}
        isOverlayVisible={isOverlayVisible}
        onFillWithBots={handleFillWithBots}
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
