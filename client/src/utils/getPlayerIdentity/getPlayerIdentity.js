import getInitials from '@/utils/getInitials'

// One source of truth for turning any player-like record into what the UI
// renders. Every seat and avatar across the lobby, waiting room, and game runs
// through this so a player's name and photo look the same everywhere. Accepts
// the shape the server sends for players ({ username, displayName, avatarUrl })
// and the session user from the auth store (same fields), and falls back
// gracefully when a field is missing.
const getPlayerIdentity = (player = {}) => {
  const name = player.displayName || player.username || 'Unknown player'

  return {
    name,
    initials: getInitials(name),
    avatarUrl: player.avatarUrl || undefined,
  }
}

export default getPlayerIdentity
