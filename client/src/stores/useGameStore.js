import { create } from 'zustand'

const useGameStore = create((set) => ({
  matchHistory: [],
  leaderboard: [],
  currentMatch: null,

  setMatchHistory: (matchHistory) => set({ matchHistory }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setCurrentMatch: (currentMatch) => set({ currentMatch }),
}))

export default useGameStore
