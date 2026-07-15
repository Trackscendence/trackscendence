// Builds the { event -> handler } map that attachSocketSessionListeners wires
// onto the socket. Pure and dependency-injected: every store, plus the two
// browser-coupled effects (the active-game DOM event and the dev-game check),
// come in as deps so the routing can be unit-tested without a socket, a
// renderer, or the window. The real wiring lives in useSocketStore.
//
// Relative import (not the @/ alias) so this module stays loadable under the
// node test runner; socketEvents is a dependency-free constants file.
import { SOCKET_EVENTS } from '../services/socketEvents.js'

export const createSocketSessionHandlers = ({
  socketStore,
  gameStore,
  chatStore,
  directMessageStore,
  authStore,
  notificationStore,
  socialNotificationStore,
  dispatchActiveGame,
  isDevGame,
  // Session guard (#391): a late socket event after teardown must not write
  // into stores that were just cleared for the next user. Injected so the
  // routing stays unit-testable; defaults to pass-through.
  hasActiveSession = () => true,
}) => {
  const currentUserId = () => authStore.getState().user?.id

  // Wraps every session-data handler; connect/disconnect stay unguarded since
  // they only track transport state.
  const forActiveSession =
    (handler) =>
    (...args) => {
      if (!hasActiveSession()) return
      handler(...args)
    }

  const handleConnect = () => {
    socketStore.getState().setConnected(true)
    // A reconnected socket is a fresh transport that missed every broadcast while
    // it was down and starts outside every server-side room. Re-join the rooms
    // watcher room and re-hydrate the list if a room-grid page is still mounted,
    // otherwise a lobby/waiting-room viewer silently stops seeing updates.
    const {
      gameState,
      requestGameState,
      watchingRooms,
      watchRooms,
      listRooms,
    } = gameStore.getState()
    if (watchingRooms) {
      watchRooms()
      listRooms()
    }
    // Replay the running game's state, if any. Dev-rigged games exist only in
    // this client, so the server is never asked about them.
    if (!gameState?.gameId) return
    if (isDevGame(gameState.gameId)) return
    requestGameState(gameState.gameId)
  }

  const handleGameError = (data) => {
    const message = data?.message || 'The move was rejected'
    gameStore.getState().setGameError(message)
    notificationStore.getState().push(message, 'error')
  }

  // Someone was caught not calling UNO. The game_state_update reconciles the
  // penalized hand; this is just the "you were caught" / "nice catch" flavor.
  const handleUnoCaught = (data) => {
    const myId = currentUserId()
    const notify = notificationStore.getState().push
    if (data?.targetUserId === myId) {
      notify('Caught! You forgot to call UNO. Draw 2.', 'error')
    } else if (data?.byUserId === myId) {
      notify('Nice catch! Your opponent draws 2.', 'success')
    }
  }

  const handleActiveGame = (data) => {
    if (!data?.gameId) return
    dispatchActiveGame(data.gameId)
  }

  const handleRoomClosed = (data) => {
    const roomId = Number(data?.roomId)
    gameStore.getState().setRoomClosed(Number.isFinite(roomId) ? roomId : true)
  }

  return {
    [SOCKET_EVENTS.CONNECT]: handleConnect,
    [SOCKET_EVENTS.DISCONNECT]: () =>
      socketStore.getState().setConnected(false),
    [SOCKET_EVENTS.LOBBY_UPDATE]: forActiveSession((data) =>
      gameStore.getState().setLobbyCount(data.count),
    ),
    [SOCKET_EVENTS.GAME_START]: forActiveSession((data) => {
      const { setMatch, setGamePlayers, setGameOutcome, setPausedGame } =
        gameStore.getState()
      setMatch(data)
      setGamePlayers(data.players)
      // A fresh game invalidates the previous game's outcome; without this a
      // stale 'won' would bounce the game page straight back to /results.
      setGameOutcome(null)
      // A brand-new game is never mid-pause, so drop any leftover overlay.
      setPausedGame(null)
    }),
    [SOCKET_EVENTS.GAME_STATE_UPDATE]: forActiveSession((data) =>
      gameStore.getState().setGameState(data),
    ),
    [SOCKET_EVENTS.GAME_OVER]: forActiveSession((data) =>
      gameStore.getState().handleGameOver(data),
    ),
    [SOCKET_EVENTS.GAME_PAUSED]: forActiveSession((data) =>
      gameStore.getState().setPausedGame(data),
    ),
    [SOCKET_EVENTS.GAME_RESUMED]: forActiveSession(() =>
      gameStore.getState().setPausedGame(null),
    ),
    [SOCKET_EVENTS.UNO_CAUGHT]: forActiveSession(handleUnoCaught),
    [SOCKET_EVENTS.ACTIVE_GAME]: forActiveSession(handleActiveGame),
    [SOCKET_EVENTS.GAME_ERROR]: forActiveSession(handleGameError),
    [SOCKET_EVENTS.ROOMS_UPDATE]: forActiveSession((data) =>
      gameStore.getState().setRooms(data),
    ),
    [SOCKET_EVENTS.ROOM_ERROR]: forActiveSession((data) =>
      gameStore.getState().setRoomError(data.message),
    ),
    [SOCKET_EVENTS.ROOM_CLOSED]: forActiveSession(handleRoomClosed),
    [SOCKET_EVENTS.CHAT_MESSAGE]: forActiveSession((data) =>
      chatStore.getState().receiveRoomMessage(data),
    ),
    [SOCKET_EVENTS.CHAT_PRIVATE_MESSAGE]: forActiveSession((data) => {
      chatStore.getState().receivePrivateMessage(data, currentUserId())
      directMessageStore?.getState().receiveMessage(data, currentUserId())
      socialNotificationStore?.getState().loadNotifications()
    }),
    [SOCKET_EVENTS.CHAT_TYPING]: forActiveSession((data) =>
      directMessageStore?.getState().receiveTyping(data),
    ),
    [SOCKET_EVENTS.CHAT_STOP_TYPING]: forActiveSession((data) =>
      directMessageStore?.getState().receiveStopTyping(data),
    ),
    [SOCKET_EVENTS.SOCIAL_NOTIFICATIONS_CHANGED]: forActiveSession(() =>
      socialNotificationStore?.getState().loadNotifications(),
    ),
    [SOCKET_EVENTS.CHAT_ROOMS]: forActiveSession((data) => {
      if (Array.isArray(data?.rooms)) {
        chatStore.getState().syncChatRooms(data.rooms)
      }
    }),
    [SOCKET_EVENTS.CHAT_ERROR]: forActiveSession((data) => {
      notificationStore
        .getState()
        .push(data?.message || 'Unable to send chat message', 'error')
    }),
  }
}

export default createSocketSessionHandlers
