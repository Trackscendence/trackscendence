// The profile stat strip renders the server's accepted-friendship total
// (stats.friendsCount, #396), which is only fetched with the profile itself.
// Accepting a request or removing a friend from the profile page changes that
// total for both sides, so the actions patch the cached copies instead of
// refetching the whole profile.
//
// Kept free of `@/` imports so the node --test suite can load it directly.

export const withFriendsCountDelta = (profile, delta) => {
  if (!profile?.stats) return profile

  const friendsCount = Math.max(0, (profile.stats.friendsCount || 0) + delta)

  return { ...profile, stats: { ...profile.stats, friendsCount } }
}
