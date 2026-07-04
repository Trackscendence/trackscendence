/**
 * Derives up-to-two-letter initials from a display name.
 * "John Doe" -> "JD", "Jane" -> "JA", "" -> "?".
 */
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default getInitials
