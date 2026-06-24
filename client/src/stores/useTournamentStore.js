import { create } from 'zustand'

const useTournamentStore = create((set) => ({
  tournaments: [],
  activeTournament: null,

  setTournaments: (tournaments) => set({ tournaments }),
  setActiveTournament: (activeTournament) => set({ activeTournament }),
}))

export default useTournamentStore
