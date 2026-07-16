const prisma = require('#db/prisma')
const {
  ACTIVE_TOURNAMENT_STATUSES,
  TOURNAMENT_ERRORS,
} = require('#modules/tournament/tournament.constants')

// Prisma's "transaction failed due to a write conflict, retry" error code.
const SERIALIZATION_CONFLICT_CODE = 'P2034'

// Prisma's "unique constraint violated" error code.
const UNIQUE_VIOLATION_CODE = 'P2002'

const tournamentUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
}

const tournamentMatchSelect = {
  id: true,
  round: true,
  slot: true,
  playerAId: true,
  playerBId: true,
  winnerId: true,
  liveGameId: true,
  gameId: true,
  roomId: true,
}

// A tournament always travels with its entrants (seed order once the bracket
// is locked, join order before that) and its matches (bracket order), so the
// service can build the full detail DTO from one read.
const tournamentDetailInclude = {
  players: {
    orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      userId: true,
      seed: true,
      eliminatedAt: true,
      user: { select: tournamentUserSelect },
    },
  },
  matches: {
    orderBy: [{ round: 'asc' }, { slot: 'asc' }],
    select: tournamentMatchSelect,
  },
}

const tournamentListSelect = {
  id: true,
  name: true,
  status: true,
  size: true,
  prizePoints: true,
  createdById: true,
  createdAt: true,
  _count: { select: { players: true } },
}

const withTransaction = (callback) => prisma.$transaction(callback)

/**
 * Runs a mutation at Serializable isolation and reports a lost race as a
 * structured CONFLICT result instead of a thrown error, so callers can retry
 * (concurrent joins on the last free seat are routine).
 */
const runSerializable = async (transactionBody) => {
  try {
    return await prisma.$transaction(transactionBody, {
      isolationLevel: 'Serializable',
    })
  } catch (error) {
    if (error.code === SERIALIZATION_CONFLICT_CODE) {
      return { error: TOURNAMENT_ERRORS.CONFLICT }
    }
    throw error
  }
}

/**
 * Tournaments for the list page, newest first, optionally filtered by status.
 * @param {{ status?: string }} [filters]
 */
const findTournaments = ({ status } = {}) => {
  return prisma.tournament.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    select: tournamentListSelect,
  })
}

/**
 * One tournament with players and matches, or null.
 * @param {number} tournamentId
 */
const findTournamentById = (tournamentId, db = prisma) => {
  return db.tournament.findUnique({
    where: { id: tournamentId },
    include: tournamentDetailInclude,
  })
}

/**
 * The OPEN or RUNNING tournament a user is entered in, if any. Players commit
 * to one tournament at a time, so this is at most one row.
 * @param {number} userId
 */
const findActiveTournamentByUserId = (userId, db = prisma) => {
  return db.tournament.findFirst({
    where: {
      status: { in: ACTIVE_TOURNAMENT_STATUSES },
      players: { some: { userId } },
    },
    include: tournamentDetailInclude,
  })
}

/**
 * The tournament owning a given match, with the full detail include.
 * @param {number} matchId
 */
const findTournamentByMatchId = (matchId, db = prisma) => {
  return db.tournament.findFirst({
    where: { matches: { some: { id: matchId } } },
    include: tournamentDetailInclude,
  })
}

/**
 * Creates an OPEN tournament shell. Creating does not enter the creator; they
 * join through the same path as everyone else.
 *
 * @param {{ name: string, size: number, prizePoints: number,
 *   totalRounds: number, createdById: number }} data
 */
const createTournament = ({
  name,
  size,
  prizePoints,
  totalRounds,
  createdById,
}) => {
  return prisma.tournament.create({
    data: { name, size, prizePoints, totalRounds, createdById },
    include: tournamentDetailInclude,
  })
}

/**
 * Enters a player, re-checking status, capacity, membership, and the
 * one-active-tournament rule inside a serializable transaction so two joins
 * racing for the last seat (or the same player joining two tournaments at
 * once) cannot both succeed.
 *
 * @param {number} tournamentId
 * @param {number} userId
 * @returns {Promise<{ tournament?: Object, error?: string }>}
 */
const addPlayerToTournament = async (tournamentId, userId) => {
  try {
    return await runSerializable(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: tournamentId },
        include: { players: true },
      })
      if (!tournament) return { error: TOURNAMENT_ERRORS.NOT_FOUND }
      if (tournament.players.some((player) => player.userId === userId)) {
        return { error: TOURNAMENT_ERRORS.ALREADY_JOINED }
      }
      if (tournament.status !== 'OPEN') {
        return { error: TOURNAMENT_ERRORS.NOT_OPEN }
      }
      if (tournament.players.length >= tournament.size) {
        return { error: TOURNAMENT_ERRORS.FULL }
      }

      const activeEntry = await tx.tournamentPlayer.findFirst({
        where: {
          userId,
          tournamentId: { not: tournamentId },
          tournament: { status: { in: ACTIVE_TOURNAMENT_STATUSES } },
        },
        select: { id: true },
      })
      if (activeEntry) return { error: TOURNAMENT_ERRORS.ACTIVE_ELSEWHERE }

      await tx.tournamentPlayer.create({ data: { tournamentId, userId } })
      const updated = await findTournamentById(tournamentId, tx)
      return { tournament: updated }
    })
  } catch (error) {
    // The only unique constraint this transaction can violate is
    // (tournamentId, userId): a concurrent request already entered this user.
    if (error.code !== UNIQUE_VIOLATION_CODE) throw error
    return { error: TOURNAMENT_ERRORS.ALREADY_JOINED }
  }
}

/**
 * Withdraws a player from a tournament that has not started. Re-checks status
 * and membership inside a serializable transaction so a leave racing the
 * creator's start cannot pull a seeded player out of a locked bracket.
 *
 * @param {number} tournamentId
 * @param {number} userId
 * @returns {Promise<{ tournament?: Object, error?: string }>}
 */
const removePlayerFromTournament = (tournamentId, userId) => {
  return runSerializable(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: true },
    })
    if (!tournament) return { error: TOURNAMENT_ERRORS.NOT_FOUND }
    if (tournament.status !== 'OPEN') {
      return { error: TOURNAMENT_ERRORS.NOT_OPEN }
    }

    const membership = tournament.players.find(
      (player) => player.userId === userId,
    )
    if (!membership) return { error: TOURNAMENT_ERRORS.NOT_A_MEMBER }

    await tx.tournamentPlayer.delete({ where: { id: membership.id } })
    const updated = await findTournamentById(tournamentId, tx)
    return { tournament: updated }
  })
}

/**
 * Locks the bracket: writes every player's seed, persists every match of
 * every round, and flips the tournament to RUNNING at round 1 — one
 * serializable transaction, so a join or leave racing the start either lands
 * before the lock or fails. Status and fullness are re-checked inside the
 * transaction; the caller has already checked who may start.
 *
 * @param {number} tournamentId
 * @param {{ seededPlayerIds: number[],
 *   matches: Array<{ round: number, slot: number,
 *     playerAId: number|null, playerBId: number|null }> }} bracket
 * @returns {Promise<{ tournament?: Object, error?: string }>}
 */
const startTournament = (tournamentId, { seededPlayerIds, matches }) => {
  return runSerializable(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: true },
    })
    if (!tournament) return { error: TOURNAMENT_ERRORS.NOT_FOUND }
    if (tournament.status !== 'OPEN') {
      return { error: TOURNAMENT_ERRORS.NOT_OPEN }
    }
    if (tournament.players.length !== tournament.size) {
      return { error: TOURNAMENT_ERRORS.NOT_FULL }
    }

    // Seeds are 1-based: they are shown to players and the seed fixture
    // writes them the same way.
    for (const [seedIndex, userId] of seededPlayerIds.entries()) {
      await tx.tournamentPlayer.update({
        where: { tournamentId_userId: { tournamentId, userId } },
        data: { seed: seedIndex + 1 },
      })
    }

    await tx.tournamentMatch.createMany({
      data: matches.map((match) => ({ tournamentId, ...match })),
    })

    const updated = await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: 'RUNNING', currentRound: 1 },
      include: tournamentDetailInclude,
    })
    return { tournament: updated }
  })
}

/**
 * Cancels an OPEN tournament. The status check and the flip are one
 * `updateMany` statement, so a cancel racing a start cannot cancel a bracket
 * that has already locked.
 *
 * @param {number} tournamentId
 * @returns {Promise<{ tournament?: Object, error?: string }>}
 */
const cancelTournament = async (tournamentId) => {
  const { count } = await prisma.tournament.updateMany({
    where: { id: tournamentId, status: 'OPEN' },
    data: { status: 'CANCELLED' },
  })
  if (count === 0) return { error: TOURNAMENT_ERRORS.NOT_OPEN }
  const tournament = await findTournamentById(tournamentId)
  return { tournament }
}

/**
 * Persists everything one match result implies, in one serializable
 * transaction: the winner (guarded compare-and-set, so a double report cannot
 * half-advance a bracket), the winner's seat in the next round, the loser's
 * elimination stamp, and the tournament's round/completion state.
 *
 * @param {number} tournamentId
 * @param {{
 *   matchId: number, winnerId: number, gameId?: number, liveGameId?: string,
 *   promotion: { matchId: number, side: 'A'|'B', playerId: number } | null,
 *   loserId: number, nextRound: number|null, tournamentComplete: boolean,
 * }} writes as computed by the engine's applyResult
 * @returns {Promise<{ tournament?: Object, error?: string }>}
 */
const applyMatchResult = (
  tournamentId,
  {
    matchId,
    winnerId,
    gameId,
    liveGameId,
    promotion,
    loserId,
    nextRound,
    tournamentComplete,
  },
) => {
  return runSerializable(async (tx) => {
    const { count: recorded } = await tx.tournamentMatch.updateMany({
      where: { id: matchId, tournamentId, winnerId: null },
      data: {
        winnerId,
        ...(gameId !== undefined ? { gameId } : {}),
        ...(liveGameId !== undefined ? { liveGameId } : {}),
      },
    })
    if (recorded === 0) return { error: TOURNAMENT_ERRORS.ALREADY_RECORDED }

    if (promotion) {
      const seatField = promotion.side === 'A' ? 'playerAId' : 'playerBId'
      await tx.tournamentMatch.updateMany({
        where: { id: promotion.matchId, tournamentId, [seatField]: null },
        data: { [seatField]: promotion.playerId },
      })
    }

    await tx.tournamentPlayer.updateMany({
      where: { tournamentId, userId: loserId, eliminatedAt: null },
      data: { eliminatedAt: new Date() },
    })

    const tournamentUpdate = tournamentComplete
      ? { status: 'COMPLETED', winnerId }
      : nextRound !== null
        ? { currentRound: nextRound }
        : null
    if (tournamentUpdate) {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: tournamentUpdate,
      })
    }

    const updated = await findTournamentById(tournamentId, tx)
    return { tournament: updated }
  })
}

module.exports = {
  withTransaction,
  findTournaments,
  findTournamentById,
  findActiveTournamentByUserId,
  findTournamentByMatchId,
  createTournament,
  addPlayerToTournament,
  removePlayerFromTournament,
  startTournament,
  cancelTournament,
  applyMatchResult,
}
