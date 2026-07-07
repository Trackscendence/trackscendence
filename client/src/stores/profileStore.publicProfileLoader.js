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

    try {
      const profileData = await loadPublicProfileData({ token, username })
      if (requestId !== publicProfileRequestId) return

      set({
        ...profileData,
        isLoading: false,
      })
      get().loadLeaderboard()
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
