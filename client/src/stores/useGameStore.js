import { create } from 'zustand'
import { socket } from '@/services/socket'
import { getLeaderboard } from '@/services/game'
import useAuthStore from '@/stores/useAuthStore'

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
  roomError: null,
  // Set by the `room:closed` event (#221) when an owner ends the room the
  // player is seated in; the waiting room watches it and hands back to the
  // lobby. Reset when the player re-enters the waiting room.
  roomClosed: false,

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
      if (!state.suppressOwnRoom) return { rooms }
      const ownUserId = useAuthStore.getState().user?.id
      const stillSeated =
        !!ownUserId &&
        rooms.some((room) =>
          room.players.some((player) => player.userId === ownUserId),
        )
      // An update that already lacks our room is the server confirming the
      // leave — stop suppressing and accept it as-is.
      if (!stillSeated) return { rooms, suppressOwnRoom: false }
      // Otherwise this is a stale in-flight broadcast: keep our own room hidden.
      return {
        rooms: rooms.filter(
          (room) => !room.players.some((player) => player.userId === ownUserId),
        ),
      }
    }),
  setRoomError: (roomError) => set({ roomError }),
  setRoomClosed: (roomClosed) => set({ roomClosed }),

  joinLobby: () => socket.emit('join_lobby'),
  // Tells the server to drop us from the matchmaking queue and resets the
  // local waiting-room state. The socket itself stays connected — it is owned
  // by the app session (App.jsx), not by the lobby page.
  leaveLobby: () => {
    socket.emit('leave_lobby')
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
    socket.emit('room:seat', capacity != null ? { capacity } : {})
  },
  // Explicit create from the lobby or the first-player quick-start picker.
  // This always asks the server to open a room owned by this player.
  createRoom: (capacity) => {
    set({ suppressOwnRoom: false })
    socket.emit('room:create', capacity != null ? { capacity } : {})
  },
  // Join a specific open room by id (the lobby grid's join button).
  joinRoomById: (roomId) => {
    set({ suppressOwnRoom: false })
    socket.emit('room:join', { roomId })
  },
  fillRoomWithBots: () => socket.emit('room:fill_bots'),
  // Leaving unseats just this player; ending closes the whole room (owner
  // only, enforced server-side). Both optimistically drop the player's own
  // room from the local grid so the lobby never lingers on a room they just
  // left while the authoritative rooms_update is in flight (#221).
  leaveRoom: () => {
    socket.emit('room:leave')
    set({ suppressOwnRoom: true })
    useGameStore.getState().dropOwnRoom()
  },
  endRoom: () => {
    socket.emit('room:end')
    set({ suppressOwnRoom: true })
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
  listRooms: () => socket.emit('room:list'),

  // Subscribe to room-list broadcasts while a room-grid page (lobby, waiting
  // room) is mounted; the flag lets a socket reconnect re-join the `rooms` room,
  // since a fresh transport starts outside every server-side room.
  watchRooms: () => {
    set({ watchingRooms: true })
    socket.emit('rooms:watch')
  },
  unwatchRooms: () => {
    set({ watchingRooms: false })
    socket.emit('rooms:unwatch')
  },

  // Intentional forfeit from the in-game exit: end the game for everyone. The
  // server tears it down and reopens the room for the players left behind; this
  // client heads to the lobby (handleGameOver reads the resulting game_over).
  leaveGame: () => socket.emit('game:leave'),

  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit('game:play_card', { gameId, cardIndex, declaredColor }),
  drawCard: (gameId) => socket.emit('game:draw_card', { gameId }),
  passTurn: (gameId) => socket.emit('game:pass_turn', { gameId }),
  // Ask the server to replay the current state of a running game (page
  // refresh, reconnect). The reply arrives as a normal game_state_update.
  requestGameState: (gameId) => socket.emit('game:state', { gameId }),
}))

export default useGameStore
