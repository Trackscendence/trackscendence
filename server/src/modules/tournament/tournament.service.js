/**
 * TournamentService - Lifecycle of single-elimination tournaments.
 *
 * A tournament gathers players while OPEN (create, join, leave, cancel), locks
 * into a bracket when the creator starts it (seeding and match layout come
 * from the pure engine in tournament.engine.js), and runs to a champion as
 * match results are folded in through `recordMatchResult`. Players commit to
 * one active tournament at a time. All HTTP-facing functions return the
 * response envelope the routes document; every repository access goes through
 * an injectable seam so unit tests run against fakes instead of a database.
 */

const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const ForbiddenException = require('#exceptions/forbidden.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const tournamentEngine = require('#modules/tournament/tournament.engine')
const tournamentRepository = require('#modules/tournament/tournament.repository')
const {
  ALLOWED_SIZES,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  TOURNAMENT_STATUSES,
  ROUND_LABELS_BY_MATCH_COUNT,
  TOURNAMENT_ERRORS,
} = require('#modules/tournament/tournament.constants')

const PRISMA_INT_MAX = 2147483647

// Serializable transactions abort on write conflicts, and joining the last
// free seat (or a result racing a retry) is exactly such a conflict. The
// service absorbs the aborts by retrying with a jittered backoff, the same
// approach the room seat path uses.
const WRITE_ATTEMPTS = 5

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const backoffBeforeRetry = (attempt) =>
  sleep(15 + Math.floor(Math.random() * 25) * (attempt + 1))

const parsePositiveInteger = (value, fieldName) => {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1 || number > PRISMA_INT_MAX) {
    throw new BadRequestException('Invalid request data', {
      details: [`${fieldName} must be a positive integer`],
    })
  }
  return number
}

const validateName = (name) => {
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  if (
    normalizedName.length < NAME_MIN_LENGTH ||
    normalizedName.length > NAME_MAX_LENGTH
  ) {
    throw new BadRequestException('Invalid request data', {
      details: [
        `name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`,
      ],
    })
  }
  return normalizedName
}

const validateSize = (size) => {
  if (!ALLOWED_SIZES.includes(size)) {
    throw new BadRequestException('Invalid request data', {
      details: [`size must be one of ${ALLOWED_SIZES.join(', ')}`],
    })
  }
  return size
}

const validatePrizePoints = (prizePoints) => {
  if (prizePoints === undefined || prizePoints === null) return 0
  if (
    !Number.isInteger(prizePoints) ||
    prizePoints < 0 ||
    prizePoints > PRISMA_INT_MAX
  ) {
    throw new BadRequestException('Invalid request data', {
      details: ['prizePoints must be a non-negative integer'],
    })
  }
  return prizePoints
}

const validateStatusFilter = (status) => {
  if (status === undefined || status === '') return undefined
  if (!TOURNAMENT_STATUSES.includes(status)) {
    throw new BadRequestException('Invalid request data', {
      details: [`status must be one of ${TOURNAMENT_STATUSES.join(', ')}`],
    })
  }
  return status
}

// The bracket view's player reference: what a seat in a match shows.
const toPlayerRef = (user) => ({
  id: user.id,
  name: user.username,
  avatarUrl: user.avatarUrl ?? null,
})

const toTournamentListItemDto = (tournament) => ({
  id: tournament.id,
  name: tournament.name,
  status: tournament.status,
  size: tournament.size,
  prizePoints: tournament.prizePoints,
  playerCount: tournament._count.players,
  createdById: tournament.createdById,
  createdAt: tournament.createdAt,
})

/**
 * Groups the flat match rows into bracket rounds for the client. Empty while
 * OPEN (no matches exist yet); each seat is a player reference or null.
 */
const buildRounds = (tournament) => {
  if (!tournament.matches || tournament.matches.length === 0) return []

  const playerRefsByUserId = new Map(
    tournament.players.map((player) => [
      player.user.id,
      toPlayerRef(player.user),
    ]),
  )

  const matchesByRound = new Map()
  for (const match of tournament.matches) {
    if (!matchesByRound.has(match.round)) matchesByRound.set(match.round, [])
    matchesByRound.get(match.round).push(match)
  }

  return [...matchesByRound.keys()]
    .sort((firstRound, secondRound) => firstRound - secondRound)
    .map((round) => {
      const matches = [...matchesByRound.get(round)].sort(
        (firstMatch, secondMatch) => firstMatch.slot - secondMatch.slot,
      )
      return {
        label: ROUND_LABELS_BY_MATCH_COUNT[matches.length] ?? `Round ${round}`,
        matches: matches.map((match) => ({
          id: match.id,
          players: [
            playerRefsByUserId.get(match.playerAId) ?? null,
            playerRefsByUserId.get(match.playerBId) ?? null,
          ],
          winnerId: match.winnerId,
        })),
      }
    })
}

/**
 * Shapes a Prisma tournament row (with the detail include) into the payload
 * clients receive. `rounds` is the client bracket view's input.
 */
const toTournamentDetailDto = (tournament) => ({
  id: tournament.id,
  name: tournament.name,
  status: tournament.status,
  size: tournament.size,
  prizePoints: tournament.prizePoints,
  currentRound: tournament.currentRound,
  totalRounds: tournament.totalRounds,
  playerCount: tournament.players.length,
  createdById: tournament.createdById,
  winnerId: tournament.winnerId,
  players: tournament.players.map((player) => ({
    id: player.user.id,
    username: player.user.username,
    seed: player.seed,
    eliminatedAt: player.eliminatedAt,
  })),
  rounds: buildRounds(tournament),
})

/**
 * Tournaments for the list page, newest first.
 * @param {{ status?: string }} [filters]
 * @returns {Promise<{ tournaments: Array<Object> }>}
 */
const listTournaments = async (
  { status } = {},
  { repository = tournamentRepository } = {},
) => {
  const statusFilter = validateStatusFilter(status)
  const tournaments = await repository.findTournaments({
    status: statusFilter,
  })
  return { tournaments: tournaments.map(toTournamentListItemDto) }
}

/**
 * The OPEN or RUNNING tournament the caller is entered in, if any.
 * @param {{ id: number }} user
 * @returns {Promise<{ tournament: Object|null }>}
 */
const getActiveTournament = async (
  user,
  { repository = tournamentRepository } = {},
) => {
  const tournament = await repository.findActiveTournamentByUserId(user.id)
  return { tournament: tournament ? toTournamentDetailDto(tournament) : null }
}

/**
 * One tournament by id.
 * @param {number|string} tournamentId
 * @returns {Promise<{ tournament: Object }>}
 */
const getTournament = async (
  tournamentId,
  { repository = tournamentRepository } = {},
) => {
  const id = parsePositiveInteger(tournamentId, 'tournamentId')
  const tournament = await repository.findTournamentById(id)
  if (!tournament) throw new NotFoundException('Tournament not found')
  return { tournament: toTournamentDetailDto(tournament) }
}

/**
 * Opens a tournament for sign-ups. Creating does not enter the creator; they
 * join through the same join endpoint as everyone else.
 *
 * @param {{ id: number }} user
 * @param {{ name: string, size: number, prizePoints?: number }} payload
 * @returns {Promise<{ tournament: Object }>}
 */
const createTournament = async (
  user,
  { name, size, prizePoints } = {},
  { repository = tournamentRepository } = {},
) => {
  const normalizedName = validateName(name)
  const validatedSize = validateSize(size)
  const validatedPrizePoints = validatePrizePoints(prizePoints)

  const tournament = await repository.createTournament({
    name: normalizedName,
    size: validatedSize,
    prizePoints: validatedPrizePoints,
    totalRounds: tournamentEngine.computeTotalRounds(validatedSize),
    createdById: user.id,
  })
  return { tournament: toTournamentDetailDto(tournament) }
}

/**
 * Enters the caller into an OPEN tournament. Refuses when the tournament has
 * started or is full, when the caller is already entered, or when the caller
 * is committed to another active tournament. Seat races are absorbed by
 * retrying the serializable join transaction.
 *
 * @param {{ id: number }} user
 * @param {number|string} tournamentId
 * @returns {Promise<{ tournament: Object }>}
 */
const joinTournament = async (
  user,
  tournamentId,
  { repository = tournamentRepository } = {},
) => {
  const id = parsePositiveInteger(tournamentId, 'tournamentId')

  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const { tournament, error } = await repository.addPlayerToTournament(
      id,
      user.id,
    )
    if (tournament) return { tournament: toTournamentDetailDto(tournament) }

    switch (error) {
      case TOURNAMENT_ERRORS.NOT_FOUND:
        throw new NotFoundException('Tournament not found')
      case TOURNAMENT_ERRORS.NOT_OPEN:
        throw new ConflictException('This tournament is no longer open')
      case TOURNAMENT_ERRORS.FULL:
        throw new ConflictException('This tournament is full')
      case TOURNAMENT_ERRORS.ALREADY_JOINED:
        throw new ConflictException('You are already in this tournament')
      case TOURNAMENT_ERRORS.ACTIVE_ELSEWHERE:
        throw new ConflictException(
          'You are already in another active tournament',
        )
      default:
        // A concurrent join/leave aborted the transaction; back off and retry.
        await backoffBeforeRetry(attempt)
    }
  }

  throw new ConflictException('Could not join the tournament, try again')
}

/**
 * Withdraws the caller from a tournament that has not started.
 *
 * @param {{ id: number }} user
 * @param {number|string} tournamentId
 * @returns {Promise<{ tournament: null }>}
 */
const leaveTournament = async (
  user,
  tournamentId,
  { repository = tournamentRepository } = {},
) => {
  const id = parsePositiveInteger(tournamentId, 'tournamentId')

  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const { error } = await repository.removePlayerFromTournament(id, user.id)
    if (!error) return { tournament: null }

    switch (error) {
      case TOURNAMENT_ERRORS.NOT_FOUND:
        throw new NotFoundException('Tournament not found')
      case TOURNAMENT_ERRORS.NOT_OPEN:
        throw new ConflictException(
          'This tournament has already started or ended',
        )
      case TOURNAMENT_ERRORS.NOT_A_MEMBER:
        throw new ConflictException('You are not in this tournament')
      default:
        await backoffBeforeRetry(attempt)
    }
  }

  throw new ConflictException('Could not leave the tournament, try again')
}

/**
 * Locks the bracket and starts the tournament. Creator only, OPEN only, and
 * every seat must be taken. Seeds are assigned by the injectable shuffle and
 * every match of every round is persisted in the same transaction that flips
 * the tournament to RUNNING.
 *
 * @param {{ id: number }} user
 * @param {number|string} tournamentId
 * @param {{ shuffle?: Function }} [options] shuffle is injectable for tests
 * @returns {Promise<{ tournament: Object }>}
 */
const startTournament = async (
  user,
  tournamentId,
  { repository = tournamentRepository, shuffle } = {},
) => {
  const id = parsePositiveInteger(tournamentId, 'tournamentId')

  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const tournament = await repository.findTournamentById(id)
    if (!tournament) throw new NotFoundException('Tournament not found')
    if (tournament.createdById !== user.id) {
      throw new ForbiddenException('Only the creator can start the tournament')
    }
    if (tournament.status !== 'OPEN') {
      throw new ConflictException('This tournament is no longer open')
    }
    if (tournament.players.length !== tournament.size) {
      throw new ConflictException('The tournament is not full yet')
    }

    const bracket = tournamentEngine.buildBracket(
      tournament.players.map((player) => player.userId),
      shuffle ? { shuffle } : {},
    )
    const { tournament: started, error } = await repository.startTournament(
      id,
      bracket,
    )
    if (started) return { tournament: toTournamentDetailDto(started) }
    if (error === TOURNAMENT_ERRORS.NOT_OPEN) {
      throw new ConflictException('This tournament is no longer open')
    }
    if (error === TOURNAMENT_ERRORS.NOT_FULL) {
      throw new ConflictException('The tournament is not full yet')
    }
    // A join/leave raced the lock; re-read the world and try again.
    await backoffBeforeRetry(attempt)
  }

  throw new ConflictException('Could not start the tournament, try again')
}

/**
 * Cancels an OPEN tournament. Creator only.
 *
 * @param {{ id: number }} user
 * @param {number|string} tournamentId
 * @returns {Promise<{ tournament: Object }>} the tournament, now CANCELLED
 */
const cancelTournament = async (
  user,
  tournamentId,
  { repository = tournamentRepository } = {},
) => {
  const id = parsePositiveInteger(tournamentId, 'tournamentId')

  const tournament = await repository.findTournamentById(id)
  if (!tournament) throw new NotFoundException('Tournament not found')
  if (tournament.createdById !== user.id) {
    throw new ForbiddenException('Only the creator can cancel the tournament')
  }
  if (tournament.status !== 'OPEN') {
    throw new ConflictException('Only an open tournament can be cancelled')
  }

  const { tournament: cancelled, error } = await repository.cancelTournament(id)
  if (error) {
    // The status flipped between the read and the guarded cancel.
    throw new ConflictException('Only an open tournament can be cancelled')
  }
  return { tournament: toTournamentDetailDto(cancelled) }
}

/**
 * Folds one finished match into the bracket. Called by the room-flow bridge
 * when a tournament match's game ends (not exposed as an HTTP endpoint).
 *
 * The engine validates the transition and describes the writes; the
 * repository persists them in one guarded transaction: the winner on the
 * match, the winner's seat in the next round, the loser's elimination stamp,
 * the round bump when the round is done, and COMPLETED + winnerId after the
 * final. A double report is rejected.
 *
 * @param {number} matchId
 * @param {number} winnerId
 * @param {{ gameId?: number, liveGameId?: string }} [options] persisted Game
 *   row id and runtime game UUID to stamp on the match
 * @returns {Promise<{ tournament: Object }>} the updated tournament detail
 */
const recordMatchResult = async (
  matchId,
  winnerId,
  { gameId, liveGameId, repository = tournamentRepository } = {},
) => {
  const validatedMatchId = parsePositiveInteger(matchId, 'matchId')
  const validatedWinnerId = parsePositiveInteger(winnerId, 'winnerId')

  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const tournament =
      await repository.findTournamentByMatchId(validatedMatchId)
    if (!tournament) throw new NotFoundException('Tournament match not found')

    const result = tournamentEngine.applyResult(
      tournament.matches,
      validatedMatchId,
      validatedWinnerId,
    )

    const { tournament: updated, error } = await repository.applyMatchResult(
      tournament.id,
      {
        matchId: validatedMatchId,
        winnerId: validatedWinnerId,
        gameId,
        liveGameId,
        promotion: result.promotion,
        loserId: result.loserId,
        nextRound:
          result.roundComplete && !result.tournamentComplete
            ? result.updatedMatch.round + 1
            : null,
        tournamentComplete: result.tournamentComplete,
      },
    )
    if (updated) return { tournament: toTournamentDetailDto(updated) }
    if (error === TOURNAMENT_ERRORS.ALREADY_RECORDED) {
      throw new ConflictException('This match result has already been recorded')
    }
    // A concurrent result aborted the transaction; re-read and re-apply.
    await backoffBeforeRetry(attempt)
  }

  throw new ConflictException('Could not record the match result, try again')
}

module.exports = {
  toTournamentDetailDto,
  listTournaments,
  getActiveTournament,
  getTournament,
  createTournament,
  joinTournament,
  leaveTournament,
  startTournament,
  cancelTournament,
  recordMatchResult,
}
