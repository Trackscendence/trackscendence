import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Dev-only flag store for The Rig (the floating dev-tools panel). This whole
// module is imported behind DEV_MODE, so it never reaches a production build.
// Flags persist to localStorage so a page reload keeps you in the same rigged
// state you were testing.
const useDevStore = create(
  persist(
    (set) => ({
      // Waiting room: auto-fill a fake opponent so you can advance past
      // matchmaking without a second real player.
      mockOpponent: false,
      // Which seeded identity the fake opponent wears.
      fillWith: 'uno',
      // Skip the waiting-room reveal delays and jump straight to the game.
      instantMatch: false,
      // The real vs. fake data source. 'live' leaves the real backend and
      // sockets untouched (LAN players can join); 'mocked' is reserved for
      // drawing screens from mock state.
      dataSource: 'live',

      setFlag: (key, value) => set({ [key]: value }),
      reset: () =>
        set({
          mockOpponent: false,
          fillWith: 'uno',
          instantMatch: false,
          dataSource: 'live',
        }),
    }),
    { name: 'trackscendence:dev-controls' },
  ),
)

// True whenever the panel is faking something — drives the orange status LED so
// you always know at a glance that what's on screen is rigged, not real.
export const selectIsRigged = (state) =>
  state.mockOpponent || state.dataSource !== 'live'

export default useDevStore
