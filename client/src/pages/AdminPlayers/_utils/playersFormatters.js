// Row-shaping helpers for the Players section, dependency-free so both the
// desktop columns and the mobile cards format identically.

export const getPlayerName = (user) => user.displayName || user.username

export const getPlayerInitials = (user) =>
  getPlayerName(user).slice(0, 2).toUpperCase()

export const formatJoinedDate = (isoDate) => {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
