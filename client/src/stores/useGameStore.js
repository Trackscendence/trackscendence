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
  setGameState: (gameState) => set({ gameState }),
  setGameError: (gameError) => set({ gameError }),

  joinLobby: () => socket.emit('join_lobby'),
  // Tells the server to drop us from the matchmaking queue and resets the
  // local waiting-room state. The socket itself stays connected — it is owned
  // by the app session (App.jsx), not by the lobby page.
  leaveLobby: () => {
    socket.emit('leave_lobby')
    set({ lobbyCount: 0, match: null })
  },
  clearGame: () => set({ match: null, gameState: null, gameError: null }),

  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit('game:play_card', { gameId, cardIndex, declaredColor }),
  drawCard: (gameId) => socket.emit('game:draw_card', { gameId }),
  passTurn: (gameId) => socket.emit('game:pass_turn', { gameId }),
}))

export default useGameStore
