import { createSessionStore } from './createSessionStore.js'

const getDefaultState = () => ({
  tournaments: [],
  activeTournament: null,
})

// Session store (#391): tournament state belongs to the signed-in session, so
// it is cleared by resetSessionStores() at teardown.
const useTournamentStore = createSessionStore((set) => ({
  ...getDefaultState(),

  setTournaments: (tournaments) => set({ tournaments }),
  setActiveTournament: (activeTournament) => set({ activeTournament }),

  reset: () => set(getDefaultState()),
}))

export default useTournamentStore
