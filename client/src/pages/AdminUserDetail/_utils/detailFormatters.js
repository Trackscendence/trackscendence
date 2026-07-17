// Formatting for the admin user detail view, dependency-free.

export const ACTION_LABELS = {
  ROLE_CHANGED: 'Role changed',
  USER_SUSPENDED: 'Suspended',
  USER_BANNED: 'Banned',
  USER_REINSTATED: 'Reinstated',
  USER_DELETED: 'Deleted',
}

export const formatDateTime = (isoDate) => {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
