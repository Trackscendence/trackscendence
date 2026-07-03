const getDisplayName = (profile) => {
  return profile?.displayName || profile?.username || 'Unknown player'
}

const getInitials = (profile) => {
  const source = getDisplayName(profile)
  const words = source.split(/\s+/).filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

const getWinRate = (stats = {}) => {
  if (!stats.gamesPlayed) return 0

  return Math.round((stats.wins / stats.gamesPlayed) * 100)
}

const formatRank = (rank) => {
  return rank ? `#${rank}` : 'No rank'
}

const formatDate = (date) => {
  if (!date) return 'Pending'

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const formatDuration = ({ endedAt, startedAt }) => {
  if (!endedAt || !startedAt) return 'Pending'

  const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime()

  if (!Number.isFinite(durationMs) || durationMs < 0) return 'Pending'

  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

const formatOpponents = (opponents = []) => {
  if (opponents.length === 0) return 'Unknown opponent'

  return opponents
    .map((opponent) => opponent.displayName || opponent.username)
    .join(', ')
}

export default {
  formatDate,
  formatDuration,
  formatOpponents,
  formatRank,
  getDisplayName,
  getInitials,
  getWinRate,
}
