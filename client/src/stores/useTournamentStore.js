import useAuthStore from '@/stores/useAuthStore'
import {
  createTournament as createTournamentRequest,
  getActiveTournament,
  getTournaments,
  joinTournament as joinTournamentRequest,
  leaveTournament as leaveTournamentRequest,
} from '@/services/tournament'
import { createSessionStore } from './createSessionStore.js'
import { isActiveToken } from './sessionGuard'

// Monotonic ids so a slow, older load cannot overwrite the result of a newer
// one (the useGameStore.loadLeaderboard pattern); the session guard is the
// cross-session complement (#391).
let listRequestId = 0
let activeRequestId = 0

// One counter behind the shared isLoading flag: the page fires the list and
// active-tournament loads together, and a plain boolean would flick off as
// soon as the first of the two settles.
let pendingCount = 0

const getDefaultState = () => ({
  tournaments: [],
  activeTournament: null,
  isLoading: false,
  error: null,
})

// Session store (#391): tournament state belongs to the signed-in session, so
// it is cleared by resetSessionStores() at teardown.
//
// Loads and join/leave surface failures as store state (`error`), which the
// page renders as a banner. createTournament instead lets the error propagate
// so CreateTournamentForm can show it inline next to the fields, the same way
// LoginForm handles login errors.
const useTournamentStore = createSessionStore((set, get) => {
  const beginRequest = () => {
    pendingCount += 1
    set({ isLoading: true, error: null })
  }

  const endRequest = () => {
    pendingCount = Math.max(0, pendingCount - 1)
    if (pendingCount === 0) set({ isLoading: false })
  }

  return {
    ...getDefaultState(),

    setTournaments: (tournaments) => set({ tournaments }),
    setActiveTournament: (activeTournament) => set({ activeTournament }),

    loadTournaments: async () => {
      const token = useAuthStore.getState().token
      const requestId = ++listRequestId
      beginRequest()
      try {
        const response = await getTournaments(token, { status: 'OPEN' })
        if (requestId === listRequestId && isActiveToken(token)) {
          set({ tournaments: response?.tournaments ?? [] })
        }
      } catch (error) {
        if (requestId === listRequestId && isActiveToken(token)) {
          set({ error: error.message })
        }
      } finally {
        endRequest()
      }
    },

    loadActiveTournament: async () => {
      const token = useAuthStore.getState().token
      const requestId = ++activeRequestId
      beginRequest()
      try {
        const response = await getActiveTournament(token)
        if (requestId === activeRequestId && isActiveToken(token)) {
          set({ activeTournament: response?.tournament ?? null })
        }
      } catch (error) {
        if (requestId === activeRequestId && isActiveToken(token)) {
          set({ error: error.message })
        }
      } finally {
        endRequest()
      }
    },

    createTournament: async (payload) => {
      const token = useAuthStore.getState().token
      beginRequest()
      try {
        const response = await createTournamentRequest(payload, token)
        if (isActiveToken(token)) {
          set({ activeTournament: response?.tournament ?? null })
        }
      } finally {
        endRequest()
      }
    },

    joinTournament: async (tournamentId) => {
      const token = useAuthStore.getState().token
      beginRequest()
      try {
        const response = await joinTournamentRequest(tournamentId, token)
        if (isActiveToken(token)) {
          set({ activeTournament: response?.tournament ?? null })
        }
      } catch (error) {
        if (isActiveToken(token)) {
          set({ error: error.message })
        }
      } finally {
        endRequest()
      }
    },

    leaveTournament: async () => {
      const tournamentId = get().activeTournament?.id
      if (!tournamentId) return

      const token = useAuthStore.getState().token
      beginRequest()
      try {
        await leaveTournamentRequest(tournamentId, token)
        if (isActiveToken(token)) {
          set({ activeTournament: null })
        }
      } catch (error) {
        if (isActiveToken(token)) {
          set({ error: error.message })
        }
      } finally {
        endRequest()
      }
    },

    reset: () => {
      // Invalidate in-flight requests so a late response from the old session
      // cannot repopulate the fresh state, and rearm the loading flag.
      listRequestId += 1
      activeRequestId += 1
      pendingCount = 0
      set(getDefaultState())
    },
  }
})

export default useTournamentStore
