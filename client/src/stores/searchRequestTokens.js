// Per-scope request tokens decide which in-flight search may commit its
// response. Each token is a unique Symbol, so a token is never reused across
// requests: a slow, older response can never match the scope's current token
// after the scope was superseded, invalidated, cleared, or reset. This is the
// counterpart to the session guard (#391), which drops responses whose session
// ended mid-flight. Kept as a standalone module so this commit-gating logic is
// unit-testable without the React store or the network.
const tokenByScope = new Map()

// Start a new request for the scope. The returned token becomes the scope's
// current one, so any earlier token immediately stops being current.
export const nextSearchToken = (scope) => {
  const token = Symbol(scope)
  tokenByScope.set(scope, token)
  return token
}

// A response may only commit while its token is still the scope's current one.
export const isCurrentSearchToken = (scope, token) =>
  tokenByScope.get(scope) === token

// Drop the scope's current token without touching visible results: a request
// that is still in flight can no longer commit, but the list stays put (used
// while a longer term debounces). A future nextSearchToken() gets a fresh
// Symbol, so the dropped token can never match again.
export const invalidateSearchScope = (scope) => {
  tokenByScope.delete(scope)
}

// Invalidate every scope at once (session teardown / store reset). Symbols are
// never reused, so emptying the map leaves no long-lived scope keys behind and
// no pre-reset response can match a post-reset request.
export const resetSearchTokens = () => {
  tokenByScope.clear()
}
