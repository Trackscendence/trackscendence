// Bracket sizes the tournament flow offers. Powers of two only: the engine
// builds a strict single-elimination bracket.
const ALLOWED_SIZES = [4, 8]

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 60

// Mirrors the Prisma TournamentStatus enum for request validation.
const TOURNAMENT_STATUSES = ['OPEN', 'RUNNING', 'COMPLETED', 'CANCELLED']

// A tournament a player is committed to: joinable-or-playing, not history.
const ACTIVE_TOURNAMENT_STATUSES = ['OPEN', 'RUNNING']

// Round labels the bracket page shows, keyed by how many matches the round has.
const ROUND_LABELS_BY_MATCH_COUNT = {
  1: 'Final',
  2: 'Semifinals',
  4: 'Quarterfinals',
}

// Structured failure reasons for the repository's transactional mutations.
// The service translates these into typed HTTP exceptions or retries.
const TOURNAMENT_ERRORS = {
  NOT_FOUND: 'NOT_FOUND',
  NOT_OPEN: 'NOT_OPEN',
  FULL: 'FULL',
  NOT_FULL: 'NOT_FULL',
  ALREADY_JOINED: 'ALREADY_JOINED',
  ACTIVE_ELSEWHERE: 'ACTIVE_ELSEWHERE',
  NOT_A_MEMBER: 'NOT_A_MEMBER',
  ALREADY_RECORDED: 'ALREADY_RECORDED',
  CONFLICT: 'CONFLICT',
}

module.exports = {
  ALLOWED_SIZES,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  TOURNAMENT_STATUSES,
  ACTIVE_TOURNAMENT_STATUSES,
  ROUND_LABELS_BY_MATCH_COUNT,
  TOURNAMENT_ERRORS,
}
