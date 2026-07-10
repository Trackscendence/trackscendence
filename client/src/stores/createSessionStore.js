import { create } from 'zustand'

// Session-scoped store factory (#391). Stores created with createSessionStore
// hold data that belongs to the signed-in user, so they register themselves for
// teardown: one resetSessionStores() call clears every registered store when the
// session ends. A store opts in at creation, which means a future user-scoped
// store is protected the moment it is written with this factory instead of
// zustand's create - there is no reset list to keep in sync.
//
// The factory registers the store's own reset() action rather than snapshotting
// initial state, so every reset builds fresh default objects (no stale shared
// references) and stores keep explicit control of what "empty" means.
//
// Stores that must survive teardown (auth, socket lifecycle, ephemeral toasts)
// use plain create() and say why at their definition.

const resetters = new Set()

export const resetSessionStores = () => {
  resetters.forEach((reset) => reset())
}

// A missing reset() is a programming error, surfaced outside production only:
// Vite sets DEV true in dev and false in builds, and under node --test there is
// no import.meta.env, which also counts as non-production.
const isNonProduction = () => import.meta.env?.DEV ?? true

export const createSessionStore = (initializer) => {
  const store = create(initializer)
  const { reset } = store.getState()

  if (typeof reset === 'function') {
    resetters.add(reset)
  } else if (isNonProduction()) {
    console.warn(
      'createSessionStore: store has no reset() action and will not be cleared on logout',
    )
  }

  return store
}
