import { getStoredToken } from '../services/tokenStorage.js'

// Stale-session guard (#391). Async store actions capture the session token
// before their await and check it again before writing, so a request that
// started under a previous session cannot repopulate a store after logout or a
// user switch. This complements the per-action request-id guards (which only
// order requests within one session) with a session-level check.
//
// Usage inside a store action:
//   const token = getActiveToken()
//   const result = await fetchSomething(token)
//   if (!isActiveToken(token)) return   // session ended or changed mid-flight
//   set({ ... })
export const isActiveToken = (token, readToken = getStoredToken) =>
  Boolean(token) && readToken() === token
