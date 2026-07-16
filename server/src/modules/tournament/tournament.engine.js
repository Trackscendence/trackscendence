/**
 * TournamentEngine - Pure single-elimination bracket logic.
 *
 * Everything here operates on plain data: the engine never touches Prisma,
 * sockets, or the clock. The service seeds a bracket with `buildBracket` when
 * a tournament starts, and folds each finished match into the bracket with
 * `applyResult`, which describes the database writes the result implies
 * (winner recorded, promotion into the next round, round/tournament
 * completion) without performing any of them. Determinism is injectable: the
 * seeding shuffle is a parameter, so tests pass an identity or seeded shuffle
 * and replay whole tournaments byte-for-byte.
 */

const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const NotFoundException = require('#exceptions/not-found.exception')

/**
 * Unbiased Fisher-Yates shuffle. Returns a new array; the input is untouched.
 * @param {Array} items
 * @returns {Array}
 */
const fisherYatesShuffle = (items) => {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }
  return shuffled
}

/**
 * Number of rounds a single-elimination bracket of this size plays
 * (4 players -> 2 rounds, 8 -> 3). Callers validate the size against
 * ALLOWED_SIZES; this guards against a non power of two slipping through.
 *
 * @param {number} size bracket size (a power of two)
 * @returns {number}
 */
const computeTotalRounds = (size) => {
  const totalRounds = Math.log2(size)
  if (!Number.isInteger(totalRounds) || totalRounds < 1) {
    throw new BadRequestException('Tournament size must be a power of two')
  }
  return totalRounds
}

/**
 * Seeds the players and lays out every match of the bracket.
 *
 * Seed order pairs into round-1 slots as (0,1), (2,3), ...; later rounds are
 * created empty and filled by promotions as results come in. The shuffle is
 * injectable so tests can seed deterministically.
 *
 * @param {number[]} playerIds user ids of every entrant (length = bracket size)
 * @param {{ shuffle?: (items: Array) => Array }} [options]
 * @returns {{
 *   seededPlayerIds: number[],
 *   matches: Array<{ round: number, slot: number,
 *     playerAId: number|null, playerBId: number|null }>,
 * }} seed order (index = seed) plus specs for every match of every round
 */
const buildBracket = (playerIds, { shuffle = fisherYatesShuffle } = {}) => {
  const totalRounds = computeTotalRounds(playerIds.length)
  const seededPlayerIds = shuffle([...playerIds])

  const matches = []
  for (let round = 1; round <= totalRounds; round += 1) {
    const matchCount = playerIds.length / 2 ** round
    for (let slot = 0; slot < matchCount; slot += 1) {
      matches.push({
        round,
        slot,
        playerAId: round === 1 ? seededPlayerIds[slot * 2] : null,
        playerBId: round === 1 ? seededPlayerIds[slot * 2 + 1] : null,
      })
    }
  }

  return { seededPlayerIds, matches }
}

/**
 * Where the winner of a match advances to: adjacent slots feed the same
 * next-round match, even slots take seat A and odd slots seat B.
 *
 * @param {number} round 1-based round of the finished match
 * @param {number} slot 0-based slot of the finished match
 * @returns {{ round: number, slot: number, side: 'A'|'B' }}
 */
const nextSeat = (round, slot) => ({
  round: round + 1,
  slot: Math.floor(slot / 2),
  side: slot % 2 === 0 ? 'A' : 'B',
})

/**
 * Folds one match result into an in-memory bracket and reports every write it
 * implies. Pure: `matches` is not mutated, and invalid transitions throw the
 * house HTTP exceptions for the service to surface as-is.
 *
 * @param {Array<Object>} matches every match row of the tournament, each with
 *   at least { id, round, slot, playerAId, playerBId, winnerId }
 * @param {number} matchId the finished match
 * @param {number} winnerId must be one of the match's two players
 * @returns {{
 *   updatedMatch: Object,
 *   promotion: { matchId: number, round: number, slot: number, side: 'A'|'B',
 *     playerId: number } | null,
 *   loserId: number,
 *   roundComplete: boolean,
 *   tournamentComplete: boolean,
 * }} `promotion` is null when the finished match was the final
 */
const applyResult = (matches, matchId, winnerId) => {
  const match = matches.find((candidate) => candidate.id === matchId)
  if (!match) {
    throw new NotFoundException('Tournament match not found')
  }
  if (match.winnerId != null) {
    throw new ConflictException('This match result has already been recorded')
  }
  if (match.playerAId == null || match.playerBId == null) {
    throw new ConflictException('This match does not have both players seated')
  }
  if (winnerId !== match.playerAId && winnerId !== match.playerBId) {
    throw new BadRequestException('The winner is not a player in this match')
  }

  const updatedMatch = { ...match, winnerId }
  const loserId =
    winnerId === match.playerAId ? match.playerBId : match.playerAId

  const totalRounds = matches.reduce(
    (highest, candidate) => Math.max(highest, candidate.round),
    0,
  )
  const isFinal = match.round === totalRounds

  let promotion = null
  if (!isFinal) {
    const seat = nextSeat(match.round, match.slot)
    const nextMatch = matches.find(
      (candidate) =>
        candidate.round === seat.round && candidate.slot === seat.slot,
    )
    if (!nextMatch) {
      throw new ConflictException('The bracket is missing the next-round match')
    }
    promotion = { matchId: nextMatch.id, ...seat, playerId: winnerId }
  }

  const roundComplete = matches
    .filter((candidate) => candidate.round === match.round)
    .every(
      (candidate) => candidate.id === matchId || candidate.winnerId != null,
    )

  return {
    updatedMatch,
    promotion,
    loserId,
    roundComplete,
    tournamentComplete: isFinal,
  }
}

module.exports = {
  computeTotalRounds,
  buildBracket,
  nextSeat,
  applyResult,
}
