import { create } from 'zustand'
import { socket } from '@/services/socket'

const useGameStore = create((set) => ({
  matchHistory: [],
  leaderboard: [],
  currentMatch: null,
  gameState: null,
  lobbyCount: 0,
  gameError: null,

  setMatchHistory: (matchHistory) => set({ matchHistory }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  setGameState: (gameState) => set({ gameState }),
  setLobbyCount: (lobbyCount) => set({ lobbyCount }),
  setGameError: (gameError) => set({ gameError }),
  clearGame: () => set({ gameState: null, gameError: null }),

  joinLobby: () => socket.emit('join_lobby'),
  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit('game:play_card', { gameId, cardIndex, declaredColor }),
  drawCard: (gameId) => socket.emit('game:draw_card', { gameId }),
  passTurn: (gameId) => socket.emit('game:pass_turn', { gameId }),
}))

export default useGameStore
