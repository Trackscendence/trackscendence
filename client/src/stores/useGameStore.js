import { create } from 'zustand'
import { socket } from '@/services/socket'
import { SOCKET_EVENTS } from '@/services/socketEvents'
import { getLeaderboard } from '@/services/game'
import useAuthStore from '@/stores/useAuthStore'
import {
  getOwnRoomIds,
  rememberClosedRoomIds,
  resolveVisibleRooms,
} from './roomVisibility'

// Monotonic id for leaderboard loads so a slow, older request cannot
// overwrite the result of a newer one.
let leaderboardRequestId = 0

const useGameStore = create((set) => ({
  leaderboard: [],
  leaderboardPagination: null,
  isLeaderboardLoading: false,
  leaderboardError: null,
  currentMatch: null,

  // Pre-game waiting room state, driven by the #88 socket contract:
  // `lobby_update` -> lobbyCount, `game_start` -> match. The match (gameId plus
  // players with usernames) is kept separate from `gameState` on purpose: the
  // in-game `game_state_update` payload carries only the engine's public state
  // (hand sizes, current player) and would otherwise clobber the player names
  // the waiting room needs to show the opponent.
  lobbyCount: 0,
  match: null,
  gameState: null,
  gameError: null,
  // How the last game ended for this user, written by handleGameOver:
  //   'won' | 'lost'   -> the game finished; go to /results
  //   'end'            -> a player left and there is no room to wait in; /results
  //   'left'           -> this client forfeited; go to /lobby
  //   'rematch'        -> a player left but the room reopened; go and wait ('/')
  // The Game page routes on it; game_start and clearGame reset it so a stale
  // outcome can never bounce a fresh game straight off the table.
  gameOutcome: null,
  // The players of the running game, written alongside `match` on game_start
  // but with a longer life: leaving the waiting room clears `match` (its
  // navigate-on-match effect must not refire on remount), while the game page
  // still needs the identities to caption opponents. Only clearGame resets it.
  gamePlayers: [],
  // Set by `game_paused` while a dropped player rides out their reconnect
  // window: { gameId, userIds, deadline }. The Game page covers the table with
  // a countdown until `game_resumed` (back in time) or game_start/clearGame
  // reset it. null whenever the game is running normally.
  pausedGame: null,

  // Persistent rooms (#185): `rooms_update` -> rooms. The waiting room derives
  // "my room" (and the opponent's name) from this list; the lobby page renders
  // it as room cards.
  rooms: [],
  // True while a room-grid page (lobby, waiting room) is watching `rooms_update`
  // broadcasts, so a socket reconnect can re-join the server-side `rooms` room.
  watchingRooms: false,
  // Suppresses the player's own room in incoming `rooms_update`s after they
  // leave, until the server confirms, so a late in-flight broadcast can't
  // re-show it (order-independent; still correct once multiple concurrent
  // rooms exist — it only ever hides the player's OWN room).
  suppressOwnRoom: false,
  // Closed rooms are hidden by id as well as by ownership. This keeps an older
  // room-list response from showing a room the owner already ended.
  suppressedClosedRoomIds: [],
  roomError: null,
  // Set by the `room:closed` event (#221) to the closed room id when an owner
  // ends a room. The waiting room compares it with the current room so a late
  // close from the previous room cannot bounce a fresh create flow.
  roomClosed: null,

  setLeaderboard: (leaderboard) => set({ leaderboard }),

  // Fetch the ranked-players list for the results screen and the leaderboard
  // page. `params` supports search/minGames/sort/order/page/limit; the
  // endpoint returns `{ leaderboard, pagination }`. Failures leave the
  // previous entries in place so consumers can fall back to them instead of
  // crashing.
  loadLeaderboard: async (params = {}) => {
    const requestId = ++leaderboardRequestId
    const token = useAuthStore.getState().token
    set({ isLeaderboardLoading: true, leaderboardError: null })
    try {
      const response = await getLeaderboard(params, token)
      if (requestId !== leaderboardRequestId) return
      set({
        leaderboard: response?.leaderboard ?? [],
        leaderboardPagination: response?.pagination ?? null,
        isLeaderboardLoading: false,
      })
    } catch (error) {
      if (requestId !== leaderboardRequestId) return
      set({
        isLeaderboardLoading: false,
        leaderboardError: error?.message || 'Failed to load the leaderboard',
      })
    }
  },
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  setLobbyCount: (lobbyCount) => set({ lobbyCount }),
  setMatch: (match) => set({ match }),
  setGamePlayers: (gamePlayers) => set({ gamePlayers }),
  setGameState: (gameState) => set({ gameState }),
  setGameError: (gameError) => set({ gameError }),
  setGameOutcome: (gameOutcome) => set({ gameOutcome }),
  // A `game_paused` for a game this client already replaced is ignored; passing
  // null (on `game_resumed`) always clears the overlay.
  setPausedGame: (pausedGame) =>
    set((state) => {
      if (!pausedGame) return { pausedGame: null }
      if (state.gameState && pausedGame.gameId !== state.gameState.gameId) {
        return {}
      }
      return { pausedGame }
    }),

  // Maps a game_over payload onto this user's outcome. 'player_left' ended the
  // match without a result: the player who left (abandonedBy) heads to the
  // lobby, while the survivors either wait in their reopened room (rematch) or,
  // if none reopened, land on the results screen. Otherwise the winner decides.
  handleGameOver: (payload) =>
    set((state) => {
      // A late game_over from a game this client already replaced must not
      // hijack the current one.
      if (state.gameState && payload.gameId !== state.gameState.gameId) {
        return {}
      }
      const ownUserId = useAuthStore.getState().user?.id
      if (payload.reason === 'player_left') {
        if (ownUserId != null && ownUserId === payload.abandonedBy) {
          return { gameOutcome: 'left' }
        }
        return { gameOutcome: payload.rematch ? 'rematch' : 'end' }
      }
      return {
        gameOutcome: payload.winnerUserId === ownUserId ? 'won' : 'lost',
      }
    }),
  setRooms: (rooms) =>
    set((state) => {
      const ownUserId = useAuthStore.getState().user?.id
      return resolveVisibleRooms({
        rooms,
        ownUserId,
        suppressOwnRoom: state.suppressOwnRoom,
        suppressedClosedRoomIds: state.suppressedClosedRoomIds,
      })
    }),
  setRoomError: (roomError) => set({ roomError }),
  setRoomClosed: (roomClosed) =>
    set((state) => {
      const roomId = Number(roomClosed)
      if (!Number.isFinite(roomId)) return { roomClosed }

      return {
        roomClosed: roomId,
        suppressedClosedRoomIds: rememberClosedRoomIds(
          state.suppressedClosedRoomIds,
          [roomId],
        ),
      }
    }),

  joinLobby: () => socket.emit(SOCKET_EVENTS.JOIN_LOBBY),
  // Tells the server to drop us from the matchmaking queue and resets the
  // local waiting-room state. The socket itself stays connected — it is owned
  // by the app session (App.jsx), not by the lobby page.
  leaveLobby: () => {
    socket.emit(SOCKET_EVENTS.LEAVE_LOBBY)
    set({ lobbyCount: 0, match: null })
  },
  clearGame: () =>
    set({
      match: null,
      gameState: null,
      gameError: null,
      gameOutcome: null,
      gamePlayers: [],
      pausedGame: null,
    }),

  // Quick-start seat: join a visible open room when one exists, otherwise open
  // a default room. The game starts once the room fills.
  seatRoom: (capacity) => {
    set({ suppressOwnRoom: false })
    socket.emit(SOCKET_EVENTS.ROOM_SEAT, capacity != null ? { capacity } : {})
  },
  // Explicit create from the lobby or the first-player quick-start picker.
  // This always asks the server to open a room owned by this player.
  createRoom: (capacity) => {
    set({ suppressOwnRoom: false })
    socket.emit(SOCKET_EVENTS.ROOM_CREATE, capacity != null ? { capacity } : {})
  },
  // Join a specific open room by id (the lobby grid's join button).
  joinRoomById: (roomId) => {
    set({ suppressOwnRoom: false })
    socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId })
  },
  fillRoomWithBots: () => socket.emit(SOCKET_EVENTS.ROOM_FILL_BOTS),
  // Leaving unseats just this player; ending closes the whole room (owner
  // only, enforced server-side). Both optimistically drop the player's own
  // room from the local grid so the lobby never lingers on a room they just
  // left while the authoritative rooms_update is in flight (#221).
  leaveRoom: () => {
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE)
    set({ suppressOwnRoom: true })
    useGameStore.getState().dropOwnRoom()
  },
  endRoom: () => {
    socket.emit(SOCKET_EVENTS.ROOM_END)
    set((state) => {
      const ownUserId = useAuthStore.getState().user?.id
      return {
        suppressOwnRoom: true,
        suppressedClosedRoomIds: rememberClosedRoomIds(
          state.suppressedClosedRoomIds,
          getOwnRoomIds(state.rooms, ownUserId),
        ),
      }
    })
    useGameStore.getState().dropOwnRoom()
  },
  dropOwnRoom: () =>
    set((state) => {
      const ownUserId = useAuthStore.getState().user?.id
      if (!ownUserId) return {}
      return {
        rooms: state.rooms.filter(
          (room) => !room.players.some((player) => player.userId === ownUserId),
        ),
      }
    }),
  listRooms: () => socket.emit(SOCKET_EVENTS.ROOM_LIST),

  // Subscribe to room-list broadcasts while a room-grid page (lobby, waiting
  // room) is mounted; the flag lets a socket reconnect re-join the `rooms` room,
  // since a fresh transport starts outside every server-side room.
  watchRooms: () => {
    set({ watchingRooms: true })
    socket.emit(SOCKET_EVENTS.ROOMS_WATCH)
  },
  unwatchRooms: () => {
    set({ watchingRooms: false })
    socket.emit(SOCKET_EVENTS.ROOMS_UNWATCH)
  },

  // Intentional forfeit from the in-game exit: end the game for everyone. The
  // server tears it down and reopens the room for the players left behind; this
  // client heads to the lobby (handleGameOver reads the resulting game_over).
  leaveGame: () => socket.emit(SOCKET_EVENTS.GAME_LEAVE),

  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit(SOCKET_EVENTS.GAME_PLAY_CARD, {
      gameId,
      cardIndex,
      declaredColor,
    }),
  drawCard: (gameId) => socket.emit(SOCKET_EVENTS.GAME_DRAW_CARD, { gameId }),
  passTurn: (gameId) => socket.emit(SOCKET_EVENTS.GAME_PASS_TURN, { gameId }),
  // Call UNO on your own last card, or catch an opponent who forgot to. Both
  // resolve on the server, which replies with a fresh game_state_update.
  callUno: (gameId) => socket.emit(SOCKET_EVENTS.GAME_CALL_UNO, { gameId }),
  catchUno: (gameId, targetUserId) =>
    socket.emit(SOCKET_EVENTS.GAME_CATCH_UNO, { gameId, targetUserId }),
  // Ask the server to replay the current state of a running game (page
  // refresh, reconnect). The reply arrives as a normal game_state_update.
  requestGameState: (gameId) =>
    socket.emit(SOCKET_EVENTS.GAME_STATE_REQUEST, { gameId }),
}))

export default useGameStore
