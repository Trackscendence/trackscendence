/**
 * Room policy knobs. The data model supports any number of rooms and any
 * capacity the engine allows; these constants are the MVP's deliberate
 * narrowing, not structural limits.
 */

// How many rooms may be OPEN at once. The MVP runs a single shared room, so
// once someone creates it every other player can only join. Raise this to
// allow parallel rooms without touching the service logic.
const MAX_OPEN_ROOMS = 1

// Seats in a room created without an explicit capacity. Matches the current
// two-player game flow; the card UI renders any capacity the server sends.
const DEFAULT_CAPACITY = 2

module.exports = {
  MAX_OPEN_ROOMS,
  DEFAULT_CAPACITY,
}
