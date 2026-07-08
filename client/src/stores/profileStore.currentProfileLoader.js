// A freshly loaded profile is treated as current for this window: a remount
// within it reuses the loaded data instead of refiring the /users/me +
// /friends fan-out. Kept short so genuine updates still surface quickly.
export const CURRENT_PROFILE_TTL_MS = 30000

export const createCurrentProfileLoader = ({
  emptyFriendContext,
  get,
  getAuthUserId,
  loadCurrentProfileData,
  now = () => Date.now(),
  requireToken,
  set,
  ttlMs = CURRENT_PROFILE_TTL_MS,
}) => {
  // Monotonic id so a slow /users/me response from an earlier mount cannot
  // overwrite a newer profile load (mirrors the public-profile loader).
  let currentProfileRequestId = 0
  // Freshness cache keyed by the authenticated user id: a logout/login as a
  // different user changes the id and always reloads within the window.
  let lastLoadedAt = 0
  let lastLoadedUserId = null

  return async ({ force = false } = {}) => {
    const token = requireToken(set)

    if (!token) return

    const authUserId = getAuthUserId()

    if (
      !force &&
      authUserId != null &&
      authUserId === lastLoadedUserId &&
      now() - lastLoadedAt < ttlMs
    ) {
      return
    }

    const requestId = ++currentProfileRequestId

    set({ error: '', isLoading: true })

    try {
      const data = await loadCurrentProfileData(token)

      if (requestId !== currentProfileRequestId) return

      set({
        ...data,
        isLoading: false,
      })
      lastLoadedAt = now()
      lastLoadedUserId = data.currentProfile?.id ?? authUserId
      // Both load off the critical path (the profile already painted with its
      // seeded friends preview): the leaderboard aggregation, and the full
      // friends list that corrects the count and fills the friends tab.
      get().loadLeaderboard()
      get().refreshFriendContext()
    } catch (error) {
      if (requestId !== currentProfileRequestId) return

      set({
        currentProfile: null,
        error: error.message,
        isLoading: false,
        ...emptyFriendContext,
      })
      lastLoadedAt = 0
      lastLoadedUserId = null
    }
  }
}
