const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const tournamentService = require('#modules/tournament/tournament.service')
const {
  TOURNAMENT_ERRORS,
} = require('#modules/tournament/tournament.constants')

const identityShuffle = (items) => [...items]

// Validation failures carry their specifics in the exception payload.
const rejectsWithDetail = (pattern) => (error) =>
  error.statusCode === 400 &&
  error.payload.details.some((detail) => pattern.test(detail))

const makeUser = (id) => ({
  id,
  username: `player${id}`,
  avatarUrl: null,
})

const makePlayerRow = (userId, { seed = null, eliminatedAt = null } = {}) => ({
  id: userId * 100,
  userId,
  seed,
  eliminatedAt,
  user: makeUser(userId),
})

// A fresh OPEN tournament with the given entrants and no matches yet.
const makeOpenTournament = ({
  id = 1,
  createdById = 7,
  size = 4,
  playerIds = [],
} = {}) => ({
  id,
  name: 'Friday Cup',
  status: 'OPEN',
  size,
  prizePoints: 100,
  currentRound: 0,
  totalRounds: Math.log2(size),
  createdById,
  winnerId: null,
  createdAt: new Date('2026-07-16T12:00:00Z'),
  players: playerIds.map((playerId) => makePlayerRow(playerId)),
  matches: [],
})

describe('createTournament validation', () => {
  const user = { id: 7 }

  it('rejects a missing or blank name', async () => {
    await assert.rejects(
      () => tournamentService.createTournament(user, { size: 4 }),
      rejectsWithDetail(/name must be between/),
    )
    await assert.rejects(
      () => tournamentService.createTournament(user, { name: '  ', size: 4 }),
      rejectsWithDetail(/name must be between/),
    )
  })

  it('rejects a name longer than 60 characters', async () => {
    await assert.rejects(
      () =>
        tournamentService.createTournament(user, {
          name: 'x'.repeat(61),
          size: 4,
        }),
      rejectsWithDetail(/name must be between/),
    )
  })

  it('rejects a size outside 4 and 8', async () => {
    for (const size of [2, 5, 6, 16, undefined, '4']) {
      await assert.rejects(
        () => tournamentService.createTournament(user, { name: 'Cup', size }),
        rejectsWithDetail(/size must be one of 4, 8/),
      )
    }
  })

  it('rejects negative or non-integer prize points', async () => {
    for (const prizePoints of [-1, 1.5, 'lots']) {
      await assert.rejects(
        () =>
          tournamentService.createTournament(user, {
            name: 'Cup',
            size: 4,
            prizePoints,
          }),
        rejectsWithDetail(/prizePoints must be a non-negative integer/),
      )
    }
  })

  it('creates with a trimmed name, computed rounds, and default prize', async () => {
    const created = []
    const repository = {
      createTournament: async (data) => {
        created.push(data)
        return makeOpenTournament({ createdById: user.id })
      },
    }

    const { tournament } = await tournamentService.createTournament(
      user,
      { name: '  Friday Cup  ', size: 8 },
      { repository },
    )

    assert.deepEqual(created, [
      {
        name: 'Friday Cup',
        size: 8,
        prizePoints: 0,
        totalRounds: 3,
        createdById: user.id,
      },
    ])
    assert.equal(tournament.name, 'Friday Cup')
    assert.deepEqual(tournament.rounds, [])
  })
})

describe('listTournaments', () => {
  it('rejects an unknown status filter', async () => {
    await assert.rejects(
      () => tournamentService.listTournaments({ status: 'PAUSED' }),
      rejectsWithDetail(/status must be one of/),
    )
  })

  it('maps rows to list items with a player count', async () => {
    const row = {
      id: 3,
      name: 'Cup',
      status: 'OPEN',
      size: 4,
      prizePoints: 50,
      createdById: 9,
      createdAt: new Date('2026-07-16T12:00:00Z'),
      _count: { players: 2 },
    }
    const repository = { findTournaments: async () => [row] }

    const { tournaments } = await tournamentService.listTournaments(
      {},
      { repository },
    )

    assert.deepEqual(tournaments, [
      {
        id: 3,
        name: 'Cup',
        status: 'OPEN',
        size: 4,
        prizePoints: 50,
        playerCount: 2,
        createdById: 9,
        createdAt: row.createdAt,
      },
    ])
  })
})

describe('joinTournament conflicts', () => {
  const user = { id: 5 }

  const repositoryFailingWith = (error) => ({
    addPlayerToTournament: async () => ({ error }),
  })

  it('404s when the tournament does not exist', async () => {
    await assert.rejects(
      () =>
        tournamentService.joinTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.NOT_FOUND),
        }),
      (error) => error.statusCode === 404,
    )
  })

  it('409s when the tournament is not open', async () => {
    await assert.rejects(
      () =>
        tournamentService.joinTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.NOT_OPEN),
        }),
      (error) =>
        error.statusCode === 409 && /no longer open/.test(error.message),
    )
  })

  it('409s when the tournament is full', async () => {
    await assert.rejects(
      () =>
        tournamentService.joinTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.FULL),
        }),
      (error) => error.statusCode === 409 && /full/.test(error.message),
    )
  })

  it('409s when the caller is already in this tournament', async () => {
    await assert.rejects(
      () =>
        tournamentService.joinTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.ALREADY_JOINED),
        }),
      (error) =>
        error.statusCode === 409 && /already in this/.test(error.message),
    )
  })

  it('409s when the caller is in another active tournament', async () => {
    await assert.rejects(
      () =>
        tournamentService.joinTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.ACTIVE_ELSEWHERE),
        }),
      (error) =>
        error.statusCode === 409 &&
        /another active tournament/.test(error.message),
    )
  })

  it('retries a lost serialization race until the join lands', async () => {
    let attempts = 0
    const repository = {
      addPlayerToTournament: async () => {
        attempts += 1
        if (attempts < 3) return { error: TOURNAMENT_ERRORS.CONFLICT }
        return {
          tournament: makeOpenTournament({ playerIds: [5] }),
        }
      },
    }

    const { tournament } = await tournamentService.joinTournament(user, 1, {
      repository,
    })

    assert.equal(attempts, 3)
    assert.equal(tournament.playerCount, 1)
  })
})

describe('leaveTournament rules', () => {
  const user = { id: 5 }

  const repositoryFailingWith = (error) => ({
    removePlayerFromTournament: async () => ({ error }),
  })

  it('404s when the tournament does not exist', async () => {
    await assert.rejects(
      () =>
        tournamentService.leaveTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.NOT_FOUND),
        }),
      (error) => error.statusCode === 404,
    )
  })

  it('409s when the tournament has started', async () => {
    await assert.rejects(
      () =>
        tournamentService.leaveTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.NOT_OPEN),
        }),
      (error) =>
        error.statusCode === 409 && /already started/.test(error.message),
    )
  })

  it('409s when the caller is not in the tournament', async () => {
    await assert.rejects(
      () =>
        tournamentService.leaveTournament(user, 1, {
          repository: repositoryFailingWith(TOURNAMENT_ERRORS.NOT_A_MEMBER),
        }),
      (error) =>
        error.statusCode === 409 &&
        /not in this tournament/.test(error.message),
    )
  })

  it('returns a null tournament after leaving', async () => {
    const repository = {
      removePlayerFromTournament: async () => ({
        tournament: makeOpenTournament(),
      }),
    }

    const response = await tournamentService.leaveTournament(user, 1, {
      repository,
    })
    assert.deepEqual(response, { tournament: null })
  })
})

describe('startTournament', () => {
  const creator = { id: 7 }

  it('403s for anyone but the creator', async () => {
    const repository = {
      findTournamentById: async () =>
        makeOpenTournament({ createdById: 7, playerIds: [1, 2, 3, 4] }),
    }

    await assert.rejects(
      () => tournamentService.startTournament({ id: 8 }, 1, { repository }),
      (error) =>
        error.statusCode === 403 && /Only the creator/.test(error.message),
    )
  })

  it('409s when the tournament is not open', async () => {
    const repository = {
      findTournamentById: async () => ({
        ...makeOpenTournament({ createdById: 7, playerIds: [1, 2, 3, 4] }),
        status: 'RUNNING',
      }),
    }

    await assert.rejects(
      () => tournamentService.startTournament(creator, 1, { repository }),
      (error) =>
        error.statusCode === 409 && /no longer open/.test(error.message),
    )
  })

  it('409s when the tournament is not full', async () => {
    const repository = {
      findTournamentById: async () =>
        makeOpenTournament({ createdById: 7, playerIds: [1, 2] }),
    }

    await assert.rejects(
      () => tournamentService.startTournament(creator, 1, { repository }),
      (error) => error.statusCode === 409 && /not full/.test(error.message),
    )
  })

  it('locks the bracket in one repository call and returns the detail', async () => {
    const startCalls = []
    const openTournament = makeOpenTournament({
      createdById: 7,
      playerIds: [10, 20, 30, 40],
    })
    const repository = {
      findTournamentById: async () => openTournament,
      startTournament: async (tournamentId, bracket) => {
        startCalls.push({ tournamentId, bracket })
        return {
          tournament: {
            ...openTournament,
            status: 'RUNNING',
            currentRound: 1,
            players: [10, 20, 30, 40].map((userId, seedIndex) =>
              makePlayerRow(userId, { seed: seedIndex }),
            ),
            matches: [
              {
                id: 1,
                round: 1,
                slot: 0,
                playerAId: 10,
                playerBId: 20,
                winnerId: null,
              },
              {
                id: 2,
                round: 1,
                slot: 1,
                playerAId: 30,
                playerBId: 40,
                winnerId: null,
              },
              {
                id: 3,
                round: 2,
                slot: 0,
                playerAId: null,
                playerBId: null,
                winnerId: null,
              },
            ],
          },
        }
      },
    }

    const { tournament } = await tournamentService.startTournament(creator, 1, {
      repository,
      shuffle: identityShuffle,
    })

    assert.equal(startCalls.length, 1)
    assert.deepEqual(startCalls[0].bracket.seededPlayerIds, [10, 20, 30, 40])
    assert.deepEqual(startCalls[0].bracket.matches, [
      { round: 1, slot: 0, playerAId: 10, playerBId: 20 },
      { round: 1, slot: 1, playerAId: 30, playerBId: 40 },
      { round: 2, slot: 0, playerAId: null, playerBId: null },
    ])
    assert.equal(tournament.status, 'RUNNING')
    assert.equal(tournament.currentRound, 1)
    assert.equal(tournament.rounds.length, 2)
  })
})

describe('cancelTournament', () => {
  const creator = { id: 7 }

  it('403s for anyone but the creator', async () => {
    const repository = {
      findTournamentById: async () => makeOpenTournament({ createdById: 7 }),
    }

    await assert.rejects(
      () => tournamentService.cancelTournament({ id: 8 }, 1, { repository }),
      (error) =>
        error.statusCode === 403 && /Only the creator/.test(error.message),
    )
  })

  it('409s when the tournament is not open', async () => {
    const repository = {
      findTournamentById: async () => ({
        ...makeOpenTournament({ createdById: 7 }),
        status: 'COMPLETED',
      }),
    }

    await assert.rejects(
      () => tournamentService.cancelTournament(creator, 1, { repository }),
      (error) => error.statusCode === 409,
    )
  })

  it('returns the tournament with status CANCELLED', async () => {
    const openTournament = makeOpenTournament({ createdById: 7 })
    const repository = {
      findTournamentById: async () => openTournament,
      cancelTournament: async () => ({
        tournament: { ...openTournament, status: 'CANCELLED' },
      }),
    }

    const { tournament } = await tournamentService.cancelTournament(
      creator,
      1,
      { repository },
    )
    assert.equal(tournament.status, 'CANCELLED')
  })
})

// The detail DTO is the exact input the client's bracket view is built
// against; this pins its shape from a mid-tournament fixture.
describe('detail DTO contract', () => {
  it('shapes an 8-player mid-tournament state exactly', async () => {
    const eliminated = new Date('2026-07-16T13:00:00Z')
    const fixture = {
      id: 42,
      name: 'Championship',
      status: 'RUNNING',
      size: 8,
      prizePoints: 500,
      currentRound: 2,
      totalRounds: 3,
      createdById: 1,
      winnerId: null,
      players: [1, 2, 3, 4, 5, 6, 7, 8].map((userId, seedIndex) =>
        makePlayerRow(userId, {
          seed: seedIndex,
          eliminatedAt: userId % 2 === 0 ? eliminated : null,
        }),
      ),
      matches: [
        // Quarterfinals: all decided, odd seeds won.
        { id: 11, round: 1, slot: 0, playerAId: 1, playerBId: 2, winnerId: 1 },
        { id: 12, round: 1, slot: 1, playerAId: 3, playerBId: 4, winnerId: 3 },
        { id: 13, round: 1, slot: 2, playerAId: 5, playerBId: 6, winnerId: 5 },
        { id: 14, round: 1, slot: 3, playerAId: 7, playerBId: 8, winnerId: 7 },
        // Semifinals: seated, undecided.
        {
          id: 21,
          round: 2,
          slot: 0,
          playerAId: 1,
          playerBId: 3,
          winnerId: null,
        },
        {
          id: 22,
          round: 2,
          slot: 1,
          playerAId: 5,
          playerBId: 7,
          winnerId: null,
        },
        // Final: still empty.
        {
          id: 31,
          round: 3,
          slot: 0,
          playerAId: null,
          playerBId: null,
          winnerId: null,
        },
      ],
    }
    const repository = { findTournamentById: async () => fixture }

    const { tournament } = await tournamentService.getTournament(42, {
      repository,
    })

    assert.deepEqual(Object.keys(tournament), [
      'id',
      'name',
      'status',
      'size',
      'prizePoints',
      'currentRound',
      'totalRounds',
      'playerCount',
      'createdById',
      'winnerId',
      'players',
      'rounds',
    ])
    assert.equal(tournament.playerCount, 8)
    assert.equal(tournament.players.length, 8)
    assert.deepEqual(Object.keys(tournament.players[0]), [
      'id',
      'username',
      'seed',
      'eliminatedAt',
    ])
    assert.deepEqual(tournament.players[1], {
      id: 2,
      username: 'player2',
      seed: 1,
      eliminatedAt: eliminated,
    })

    assert.deepEqual(
      tournament.rounds.map((round) => round.label),
      ['Quarterfinals', 'Semifinals', 'Final'],
    )
    assert.deepEqual(
      tournament.rounds.map((round) => round.matches.length),
      [4, 2, 1],
    )
    for (const round of tournament.rounds) {
      assert.deepEqual(Object.keys(round), ['label', 'matches'])
      for (const match of round.matches) {
        assert.deepEqual(Object.keys(match), ['id', 'players', 'winnerId'])
        assert.equal(match.players.length, 2)
      }
    }

    const [quarterfinals, semifinals, finals] = tournament.rounds
    assert.deepEqual(quarterfinals.matches[0], {
      id: 11,
      players: [
        { id: 1, name: 'player1', avatarUrl: null },
        { id: 2, name: 'player2', avatarUrl: null },
      ],
      winnerId: 1,
    })
    assert.deepEqual(semifinals.matches[1].players, [
      { id: 5, name: 'player5', avatarUrl: null },
      { id: 7, name: 'player7', avatarUrl: null },
    ])
    assert.equal(semifinals.matches[1].winnerId, null)
    assert.deepEqual(finals.matches[0], {
      id: 31,
      players: [null, null],
      winnerId: null,
    })
  })
})

describe('recordMatchResult', () => {
  // A RUNNING 4-player tournament in round 1.
  const makeRunningFour = ({ matchOverrides = {} } = {}) => ({
    id: 9,
    name: 'Cup',
    status: 'RUNNING',
    size: 4,
    prizePoints: 0,
    currentRound: 1,
    totalRounds: 2,
    createdById: 10,
    winnerId: null,
    players: [10, 20, 30, 40].map((userId, seedIndex) =>
      makePlayerRow(userId, { seed: seedIndex }),
    ),
    matches: [
      {
        id: 1,
        round: 1,
        slot: 0,
        playerAId: 10,
        playerBId: 20,
        winnerId: null,
      },
      {
        id: 2,
        round: 1,
        slot: 1,
        playerAId: 30,
        playerBId: 40,
        winnerId: null,
      },
      {
        id: 3,
        round: 2,
        slot: 0,
        playerAId: null,
        playerBId: null,
        winnerId: null,
      },
    ].map((match) => ({ ...match, ...(matchOverrides[match.id] || {}) })),
  })

  const makeRecordingRepository = (fixture) => {
    const applied = []
    const repository = {
      findTournamentByMatchId: async () => fixture,
      applyMatchResult: async (tournamentId, writes) => {
        applied.push({ tournamentId, writes })
        return { tournament: fixture }
      },
    }
    return { repository, applied }
  }

  it('writes the winner, promotion, and loser elimination', async () => {
    const { repository, applied } = makeRecordingRepository(makeRunningFour())

    await tournamentService.recordMatchResult(1, 20, {
      gameId: 77,
      liveGameId: 'live-uuid',
      repository,
    })

    assert.equal(applied.length, 1)
    assert.deepEqual(applied[0], {
      tournamentId: 9,
      writes: {
        matchId: 1,
        winnerId: 20,
        gameId: 77,
        liveGameId: 'live-uuid',
        promotion: { matchId: 3, round: 2, slot: 0, side: 'A', playerId: 20 },
        loserId: 10,
        nextRound: null,
        tournamentComplete: false,
      },
    })
  })

  it('bumps the round when the last match of the round reports', async () => {
    const fixture = makeRunningFour({
      matchOverrides: { 1: { winnerId: 10 } },
    })
    const { repository, applied } = makeRecordingRepository(fixture)

    await tournamentService.recordMatchResult(2, 40, { repository })

    assert.equal(applied[0].writes.nextRound, 2)
    assert.equal(applied[0].writes.tournamentComplete, false)
    assert.deepEqual(applied[0].writes.promotion, {
      matchId: 3,
      round: 2,
      slot: 0,
      side: 'B',
      playerId: 40,
    })
  })

  it('completes the tournament at the final', async () => {
    const fixture = makeRunningFour({
      matchOverrides: {
        1: { winnerId: 10 },
        2: { winnerId: 40 },
        3: { playerAId: 10, playerBId: 40 },
      },
    })
    fixture.currentRound = 2
    const { repository, applied } = makeRecordingRepository(fixture)

    await tournamentService.recordMatchResult(3, 40, { repository })

    assert.equal(applied[0].writes.tournamentComplete, true)
    assert.equal(applied[0].writes.promotion, null)
    assert.equal(applied[0].writes.nextRound, null)
    assert.equal(applied[0].writes.loserId, 10)
  })

  it('rejects a double report without touching the database', async () => {
    const fixture = makeRunningFour({
      matchOverrides: { 1: { winnerId: 10 } },
    })
    const { repository, applied } = makeRecordingRepository(fixture)

    await assert.rejects(
      () => tournamentService.recordMatchResult(1, 20, { repository }),
      (error) =>
        error.statusCode === 409 && /already been recorded/.test(error.message),
    )
    assert.equal(applied.length, 0)
  })

  it('surfaces a raced double report from the guarded write', async () => {
    const repository = {
      findTournamentByMatchId: async () => makeRunningFour(),
      applyMatchResult: async () => ({
        error: TOURNAMENT_ERRORS.ALREADY_RECORDED,
      }),
    }

    await assert.rejects(
      () => tournamentService.recordMatchResult(1, 20, { repository }),
      (error) => error.statusCode === 409,
    )
  })

  it('404s for a match no tournament owns', async () => {
    const repository = { findTournamentByMatchId: async () => null }

    await assert.rejects(
      () => tournamentService.recordMatchResult(1, 20, { repository }),
      (error) => error.statusCode === 404,
    )
  })

  // The game-end hooks call this for every finished game; only games that
  // host a bracket match may touch the tournament tables.
  describe('recordResultForLiveGame', () => {
    it('returns null and writes nothing when no match hosts the game', async () => {
      const lookups = []
      const repository = {
        findMatchByLiveGameId: async (liveGameId) => {
          lookups.push(liveGameId)
          return null
        },
        findTournamentByMatchId: async () => {
          throw new Error('must not read the tournament for a casual game')
        },
      }

      const result = await tournamentService.recordResultForLiveGame(
        'live-uuid',
        20,
        { repository },
      )

      assert.equal(result, null)
      assert.deepEqual(lookups, ['live-uuid'])
    })

    it('records the result against the hosting match', async () => {
      const fixture = makeRunningFour()
      const { repository, applied } = makeRecordingRepository(fixture)
      repository.findMatchByLiveGameId = async () => fixture.matches[0]

      const result = await tournamentService.recordResultForLiveGame(
        'live-uuid',
        20,
        { gameId: 77, repository },
      )

      assert.ok(result.tournament)
      assert.equal(applied.length, 1)
      assert.equal(applied[0].writes.matchId, 1)
      assert.equal(applied[0].writes.winnerId, 20)
      assert.equal(applied[0].writes.gameId, 77)
      assert.equal(applied[0].writes.liveGameId, 'live-uuid')
    })
  })
})
