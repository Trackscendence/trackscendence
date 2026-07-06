/**
 * Room policy knobs. The data model supports any number of rooms and any
 * capacity the engine allows; these constants are the MVP's deliberate
 * narrowing, not structural limits.
 */

// How many rooms may be OPEN at once. We deliberately keep this at one: the
// game runs a single shared room at a time. The first player to arrive opens
// it (with a chosen capacity), everyone else joins that same room, and it is
// gone once the game starts, empties, or the owner ends it — at which point the
// next player can open a fresh one. One room keeps the flow simple with a small
// player base (#156).
const MAX_OPEN_ROOMS = 1

// Seats in a room created without an explicit capacity. The waiting-room
// auto-seat uses this, keeping the quick two-player game the default; the
// lobby's "create room" flow passes an explicit capacity instead.
const DEFAULT_CAPACITY = 2

// Capacities a player may request when creating a room. The engine allows
// 2 to 10; these are the sizes the UI offers.
const ALLOWED_CAPACITIES = [2, 3, 4, 6]

module.exports = {
  MAX_OPEN_ROOMS,
  DEFAULT_CAPACITY,
  ALLOWED_CAPACITIES,
}
