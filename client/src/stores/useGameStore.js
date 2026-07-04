import { create } from 'zustand'
import { joinMatchmaking } from '@/services/matchmaking'

const useGameStore = create((set, get) => ({
  matchHistory: [],
  leaderboard: [],
  currentMatch: null,

  // Pre-game waiting room state. Field names mirror the #88 socket contract
  // (`lobby_update` -> lobbyCount, `game_start` -> gameState) so the mock
  // matchmaking driver can be swapped for real socket listeners without
  // touching consumers.
  lobbyCount: 0,
  gameState: null,
  cancelMatchmaking: null,

  setMatchHistory: (matchHistory) => set({ matchHistory }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  setLobbyCount: (lobbyCount) => set({ lobbyCount }),
  setGameState: (gameState) => set({ gameState }),

  joinLobby: (me) => {
    get().cancelMatchmaking?.()
    const cancel = joinMatchmaking({
      me,
      onLobbyUpdate: (lobbyCount) => set({ lobbyCount }),
      onGameStart: (gameState) => set({ gameState }),
    })
    set({ cancelMatchmaking: cancel })
  },

  leaveLobby: () => {
    get().cancelMatchmaking?.()
    set({ lobbyCount: 0, gameState: null, cancelMatchmaking: null })
  },

  clearGame: () => set({ gameState: null }),
}))

export default useGameStore
