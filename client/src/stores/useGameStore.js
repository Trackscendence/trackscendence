import { create } from 'zustand'
import { socket } from '@/services/socket'
import { getLeaderboard } from '@/services/game'
import useAuthStore from '@/stores/useAuthStore'

// Monotonic id for leaderboard loads so a slow, older request cannot
// overwrite the result of a newer one.
let leaderboardRequestId = 0

const useGameStore = create((set) => ({
  matchHistory: [],
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
  // How the last game ended for this user: 'won' | 'lost' | 'end' (a player
  // left), written by handleGameOver. The Game page navigates to /results
  // when it appears; game_start and clearGame reset it so a stale outcome can
  // never bounce a fresh game straight to the results screen.
  gameOutcome: null,
  // The players of the running game, written alongside `match` on game_start
  // but with a longer life: leaving the waiting room clears `match` (its
  // navigate-on-match effect must not refire on remount), while the game page
  // still needs the identities to caption opponents. Only clearGame resets it.
  gamePlayers: [],

  // Persistent rooms (#185): `rooms_update` -> rooms. The waiting room derives
  // "my room" (and the opponent's name) from this list; the lobby page renders
  // it as room cards.
  rooms: [],
  roomError: null,
  // Set by the `room:closed` event (#221) when an owner ends the room the
  // player is seated in; the waiting room watches it and hands back to the
  // lobby. Reset when the player re-enters the waiting room.
  roomClosed: false,

  setMatchHistory: (matchHistory) => set({ matchHistory }),
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

  // Maps a game_over payload onto this user's outcome. 'player_left' means
  // the match ended without a result; otherwise the winner id decides it.
  handleGameOver: (payload) =>
    set((state) => {
      // A late game_over from a game this client already replaced must not
      // hijack the current one.
      if (state.gameState && payload.gameId !== state.gameState.gameId) {
        return {}
      }
      if (payload.reason === 'player_left') {
        return { gameOutcome: 'end' }
      }
      const ownUserId = useAuthStore.getState().user?.id
      return {
        gameOutcome: payload.winnerUserId === ownUserId ? 'won' : 'lost',
      }
    }),
  setRooms: (rooms) => set({ rooms }),
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
    }),

  // Auto-seat: the server puts the player in the open room, creating one if
  // none exists (first in owns it), and starts the game once the room fills.
  seatRoom: () => socket.emit('room:seat'),
  // Leaving unseats just this player; ending closes the whole room (owner
  // only, enforced server-side). Both optimistically drop the player's own
  // room from the local grid so the lobby never lingers on a room they just
  // left while the authoritative rooms_update is in flight (#221).
  leaveRoom: () => {
    socket.emit('room:leave')
    useGameStore.getState().dropOwnRoom()
  },
  endRoom: () => {
    socket.emit('room:end')
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

  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit('game:play_card', { gameId, cardIndex, declaredColor }),
  drawCard: (gameId) => socket.emit('game:draw_card', { gameId }),
  passTurn: (gameId) => socket.emit('game:pass_turn', { gameId }),
  // Ask the server to replay the current state of a running game (page
  // refresh, reconnect). The reply arrives as a normal game_state_update.
  requestGameState: (gameId) => socket.emit('game:state', { gameId }),
}))

export default useGameStore
