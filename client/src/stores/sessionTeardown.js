import useAuthStore from './useAuthStore'
import useSocketStore from './useSocketStore'
import { resetSessionStores } from './createSessionStore'

// Session teardown trigger (#391). Subscribes to the auth store so the reset
// runs synchronously inside the auth state transition - before any re-render -
// whenever the token clears (logout, clearSession, session expiry) or changes
// (a different user signs in). The socket disconnects first so no late event
// can write into a store that was just cleared; App.jsx's token effect will
// reconnect it for a new session.
export const initSessionTeardown = () => {
  let previousToken = useAuthStore.getState().token

  return useAuthStore.subscribe((state) => {
    if (state.token === previousToken) return

    const endedSession = Boolean(previousToken)
    previousToken = state.token

    if (endedSession) {
      useSocketStore.getState().disconnect()
      resetSessionStores()
    }
  })
}
