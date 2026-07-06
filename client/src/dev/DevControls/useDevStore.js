import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Dev-only flag store for The Rig (the floating dev-tools panel). This whole
// module is imported behind DEV_MODE, so it never reaches a production build.
//
// Persistence policy: only harmless preferences (which identity to fake, which
// outcome to preview) survive a reload. Rig flags — mock opponent, data source —
// always start live. A flag left on in yesterday's session silently faking
// today's login is worse than having to flip a switch again, and the persisted
// value also rehydrates after the injection effects' first pass, leaving the
// UI showing "on" without the fake actually applied.
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
      // Which result the "Skip to outcome" jump lands on. Just a nav preference
      // for the results screen — not a rigged state, so it stays out of
      // `selectIsRigged`.
      outcomeState: 'won',
      // Game simulation: bots play a full game on the table, no second player
      // needed. The switch is a rig flag (never persisted); speed and player
      // count are harmless preferences.
      simulateGame: false,
      simSpeed: 'normal',
      simPlayers: '2',
      // Bumped by the Restart button; the sim hook re-deals when it changes.
      simRunId: 0,

      setFlag: (key, value) => set({ [key]: value }),
      restartSim: () => set((state) => ({ simRunId: state.simRunId + 1 })),
      reset: () =>
        set({
          mockOpponent: false,
          fillWith: 'uno',
          instantMatch: false,
          dataSource: 'live',
          outcomeState: 'won',
          simulateGame: false,
          simSpeed: 'normal',
          simPlayers: '2',
        }),
    }),
    {
      name: 'trackscendence:dev-controls',
      // v1 drops rig flags from storage (see persistence policy above). The
      // migrate step also strips them from entries written before this version,
      // so a stale `mockOpponent: true` can't leak back in on rehydrate.
      version: 1,
      partialize: (state) => ({
        fillWith: state.fillWith,
        outcomeState: state.outcomeState,
        simSpeed: state.simSpeed,
        simPlayers: state.simPlayers,
      }),
      migrate: (persistedState) => ({
        fillWith: persistedState?.fillWith ?? 'uno',
        outcomeState: persistedState?.outcomeState ?? 'won',
        simSpeed: persistedState?.simSpeed ?? 'normal',
        simPlayers: persistedState?.simPlayers ?? '2',
      }),
    },
  ),
)

// True whenever the panel is faking something — drives the orange status LED so
// you always know at a glance that what's on screen is rigged, not real.
export const selectIsRigged = (state) =>
  state.mockOpponent || state.dataSource !== 'live' || state.simulateGame

export default useDevStore
