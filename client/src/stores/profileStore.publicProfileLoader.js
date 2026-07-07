export const createPublicProfileLoader = ({
  get,
  loadPublicProfileData,
  requireToken,
  set,
}) => {
  // Monotonic id for public profile loads so a slow response from an older
  // `/users/:username` navigation cannot overwrite the currently viewed profile.
  let publicProfileRequestId = 0

  return async (username) => {
    const requestId = ++publicProfileRequestId
    const token = requireToken(set)

    if (!token) return

    set({ error: '', isLoading: true, publicProfile: null })

    // Fetch the leaderboard alongside the public profile rather than after it
    // resolves, so the sidebar does not waterfall in behind the profile.
    get().loadLeaderboard()

    try {
      const profileData = await loadPublicProfileData({ token, username })
      if (requestId !== publicProfileRequestId) return

      set({
        ...profileData,
        isLoading: false,
      })
    } catch (error) {
      if (requestId !== publicProfileRequestId) return

      set({
        error: error.message,
        isLoading: false,
        publicProfile: null,
        relationship: null,
      })
    }
  }
}
