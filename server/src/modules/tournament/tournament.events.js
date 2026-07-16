/**
 * TournamentEvents - the tournament module's domain event channel.
 *
 * The tournament service stays free of Socket.IO: after every successful
 * state change it emits one of these events on the shared emitter, carrying
 * the same detail DTO it returns to HTTP callers. The socket-side bridge
 * (src/socket/tournament.bridge.js) is the subscriber that turns them into
 * rooms, games, and socket broadcasts. When nothing subscribes (unit tests
 * exercising the service alone), the emissions are harmless no-ops.
 */

const { EventEmitter } = require('node:events')

const TOURNAMENT_EVENTS = {
  // { tournament } - a player entered an OPEN tournament.
  PLAYER_JOINED: 'player_joined',
  // { tournament, leftUserId } - a player withdrew before the start.
  PLAYER_LEFT: 'player_left',
  // { tournament, readyMatches } - the bracket locked; round 1 is seated.
  STARTED: 'started',
  // { tournament, readyMatches } - a match result was folded into the bracket.
  MATCH_RESULT: 'match_result',
  // { tournament } - the final was decided; the tournament has a champion.
  COMPLETED: 'completed',
  // { tournament } - the creator cancelled an OPEN tournament.
  CANCELLED: 'cancelled',
}

const tournamentEvents = new EventEmitter()

module.exports = { tournamentEvents, TOURNAMENT_EVENTS }
