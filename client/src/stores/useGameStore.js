import { create } from 'zustand'
import { socket } from '@/services/socket'
import { getLeaderboard } from '@/services/game'
import useAuthStore from '@/stores/useAuthStore'

const useGameStore = create((set) => ({
  matchHistory: [],
  leaderboard: [],
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

  // Fetch the ranked-players list for the results screen. The endpoint returns
  // `{ leaderboard }`; failures leave the previous value in place so the screen
  // can fall back to its own empty/mock state rather than crashing.
  loadLeaderboard: async () => {
    const token = useAuthStore.getState().token
    try {
      const response = await getLeaderboard(token)
      set({ leaderboard: response?.leaderboard ?? [] })
    } catch {
      // Container owns the empty-state fallback.
    }
  },
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  setLobbyCount: (lobbyCount) => set({ lobbyCount }),
  setMatch: (match) => set({ match }),
  setGameState: (gameState) => set({ gameState }),
  setGameError: (gameError) => set({ gameError }),

  joinLobby: () => socket.emit('join_lobby'),
  // No server `leave_lobby` event exists yet; the server drops a player from
  // the queue when their socket disconnects, so leaving is handled at the
  // socket layer. This just resets the local waiting-room state.
  leaveLobby: () => set({ lobbyCount: 0, match: null }),
  clearGame: () => set({ match: null, gameState: null, gameError: null }),

  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit('game:play_card', { gameId, cardIndex, declaredColor }),
  drawCard: (gameId) => socket.emit('game:draw_card', { gameId }),
  passTurn: (gameId) => socket.emit('game:pass_turn', { gameId }),
}))

export default useGameStore
