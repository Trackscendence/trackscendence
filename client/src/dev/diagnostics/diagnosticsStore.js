import { create } from 'zustand'

// The debug HUD's event log. This whole module is imported behind
// import.meta.env.DEV, so it never reaches a production build.
//
// Bounded by construction: the log is a ring buffer capped at MAX_EVENTS. A
// long-running dev session throws off a steady stream of failed requests and
// console errors, and an unbounded array here would be the exact kind of slow
// leak the HUD exists to catch. Oldest events fall off the front.
export const MAX_EVENTS = 50

// Monotonic id so React keys stay stable as the buffer scrolls. A plain
// counter is enough — these ids never leave the browser tab.
let nextEventId = 0

// Pure, and the reason the log can't leak: append then keep only the last
// `max`, so the array length is bounded by construction no matter how many
// errors a session throws. Extracted so the bound is directly testable.
export const appendBounded = (events, event, max = MAX_EVENTS) =>
  [...events, event].slice(-max)

const useDiagnosticsStore = create((set) => ({
  events: [],

  // event: { kind: 'error' | 'rejection' | 'request', label, detail, at }
  push: (event) =>
    set((state) => ({
      events: appendBounded(state.events, {
        id: (nextEventId += 1),
        at: Date.now(),
        ...event,
      }),
    })),

  clear: () => set({ events: [] }),
}))

export default useDiagnosticsStore
