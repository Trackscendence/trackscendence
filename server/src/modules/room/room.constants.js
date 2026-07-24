/**
 * Room policy knobs. The data model supports any number of rooms and any
 * capacity the engine allows; these constants are the MVP's deliberate
 * narrowing, not structural limits.
 */

// How many rooms may be OPEN at once. The schema can hold more, but the lobby
// should stay bounded so abandoned rooms cannot grow without limit.
const MAX_OPEN_ROOMS = 8

// Seats in a room created without an explicit capacity. The waiting-room
// auto-seat uses this, keeping the quick two-player game the default; the
// lobby's "create room" flow passes an explicit capacity instead.
const DEFAULT_CAPACITY = 2

// Capacities a player may request when creating a room. The engine allows
// 2 to 6; the table currently supports up to six seats while keeping the
// quick-start menu small.
const ALLOWED_CAPACITIES = [2, 3, 4, 6]

module.exports = {
  MAX_OPEN_ROOMS,
  DEFAULT_CAPACITY,
  ALLOWED_CAPACITIES,
}
