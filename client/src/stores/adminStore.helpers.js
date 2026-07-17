// Pure list/pending-map helpers for useAdminStore, dependency-free so the node
// test runner can load them directly (see "node-tested modules" in
// docs/frontend-coding-standards.md). All of them return new objects — store
// state is never mutated in place.

// Reconcile one row from a server response into the list. Only the matching
// id changes; the merge keeps fields the response did not include.
export const replaceUser = (users, updatedUser) => {
  if (!updatedUser) return users
  return users.map((user) =>
    user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
  )
}

export const removeUser = (users, userId) => {
  return users.filter((user) => user.id !== userId)
}

// Per-row pending flags: `withPending` marks a row busy with a named action so
// the table can spin one row without freezing the rest; `withoutPending` is
// its mandatory counterpart — every action clears its flag on both the success
// and the failure path, so the map cannot accumulate stale entries.
export const withPending = (pendingActions, userId, action) => {
  return { ...pendingActions, [userId]: action }
}

export const withoutPending = (pendingActions, userId) => {
  const next = { ...pendingActions }
  delete next[userId]
  return next
}
