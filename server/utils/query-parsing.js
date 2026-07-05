const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50
// Caps the OFFSET a caller can force on paginated queries; pages past the
// data simply return an empty list.
const MAX_PAGE = 1000

/**
 * Parses one positive-integer query parameter. Invalid values push a message
 * onto `details` (so callers can report every bad field at once) and fall
 * back to `fallback`; valid values are clamped to `max` when provided.
 */
const parsePositiveInteger = ({
  details,
  fieldName,
  max,
  rawValue,
  fallback,
}) => {
  if (rawValue == null || rawValue === '') {
    return fallback
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value) || value < 1) {
    details.push(`${fieldName} must be a positive integer`)
    return fallback
  }

  return max ? Math.min(value, max) : value
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  parsePositiveInteger,
}
