const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const socketHandlers = require('./socket.handlers')
const { initTournamentBridge } = require('./tournament.bridge')
const { enqueueRoomAction } = require('./room-action-guard')
const gameStore = require('#modules/game/game.store')
const gameService = require('#modules/game/game.service')
const matchmaking = require('#modules/game/matchmaking.service')
const turnTimers = require('#modules/game/turn-timer.service')
const roomService = require('#modules/room/room.service')
const tournamentRepository = require('#modules/tournament/tournament.repository')
const tournamentService = require('#modules/tournament/tournament.service')
const {
  TOURNAMENT_ERRORS,
} = require('#modules/tournament/tournament.constants')

const identityShuffle = (items) => [...items]

// Records every targeted emit so the test can assert what each user room and
// game room was told, and satisfies the socketsJoin/socketsLeave calls
// startMatch makes when it moves players into their game.
const createRecordingIo = () => {
  const emitted = []
  return {
    emitted,
    to: (room) => ({
      emit: (event, payload) => emitted.push({ room, event, payload }),
    }),
    in: () => ({
      socketsLeave: () => {},
      socketsJoin: () => {},
      fetchSockets: async () => [],
    }),
    emit: () => {},
  }
}

// Restore whatever methods a test patched on the shared service singletons.
const withStubs = async (stubs, body) => {
  const originals = stubs.map(([object, key]) => [object, key, object[key]])
  stubs.forEach(([object, key, fn]) => {
    object[key] = fn
  })
  try {
    await body()
  } finally {
    originals.forEach(([object, key, fn]) => {
      object[key] = fn
    })
  }
}

/**
 * In-memory stand-in for the tournament repository: one mutable tournament
 * whose bracket the service reads and writes through the same contract the
 * Prisma repository implements. Losers are stamped with a strictly
 * increasing eliminatedAt so elimination order can be asserted.
 */
const createTournamentFixture = ({ id = 9, playerIds }) => {
  const state = {
    id,
    name: 'Friday Cup',
    status: 'OPEN',
    size: playerIds.length,
    prizePoints: 0,
    currentRound: 0,
    totalRounds: Math.log2(playerIds.length),
    createdById: playerIds[0],
    winnerId: null,
    createdAt: new Date('2026-07-16T12:00:00Z'),
    players: playerIds.map((userId) => ({
      id: userId * 100,
      userId,
      seed: null,
      eliminatedAt: null,
      user: { id: userId, username: `player${userId}`, avatarUrl: null },
    })),
    matches: [],
  }
  let nextMatchId = 1
  let eliminationTick = 0

  const repository = {
    findTournamentById: async () => state,
    startTournament: async (tournamentId, { seededPlayerIds, matches }) => {
      seededPlayerIds.forEach((userId, seedIndex) => {
        state.players.find((player) => player.userId === userId).seed =
          seedIndex
      })
      state.matches = matches.map((match) => ({
        id: nextMatchId++,
        ...match,
        winnerId: null,
        liveGameId: null,
        gameId: null,
        roomId: null,
      }))
      state.status = 'RUNNING'
      state.currentRound = 1
      return { tournament: state }
    },
    findTournamentByMatchId: async (matchId) =>
      state.matches.some((match) => match.id === matchId) ? state : null,
    findMatchById: async (matchId) =>
      state.matches.find((match) => match.id === matchId) ?? null,
    findMatchByLiveGameId: async (liveGameId) =>
      state.matches.find((match) => match.liveGameId === liveGameId) ?? null,
    claimMatchForGame: async (matchId, { liveGameId, roomId }) => {
      const match = state.matches.find((candidate) => candidate.id === matchId)
      if (!match || match.liveGameId != null || match.winnerId != null) {
        return false
      }
      match.liveGameId = liveGameId
      match.roomId = roomId
      return true
    },
    applyMatchResult: async (tournamentId, writes) => {
      const match = state.matches.find(
        (candidate) => candidate.id === writes.matchId,
      )
      if (!match || match.winnerId != null) {
        return { error: TOURNAMENT_ERRORS.ALREADY_RECORDED }
      }
      match.winnerId = writes.winnerId
      if (writes.gameId !== undefined) match.gameId = writes.gameId
      if (writes.liveGameId !== undefined) match.liveGameId = writes.liveGameId
      if (writes.promotion) {
        const nextMatch = state.matches.find(
          (candidate) => candidate.id === writes.promotion.matchId,
        )
        if (writes.promotion.side === 'A') {
          nextMatch.playerAId = writes.promotion.playerId
        } else {
          nextMatch.playerBId = writes.promotion.playerId
        }
      }
      const loser = state.players.find(
        (player) => player.userId === writes.loserId,
      )
      if (loser && loser.eliminatedAt == null) {
        eliminationTick += 1
        loser.eliminatedAt = new Date(2026, 6, 16, 12, 0, eliminationTick)
      }
      if (writes.tournamentComplete) {
        state.status = 'COMPLETED'
        state.winnerId = writes.winnerId
      } else if (writes.nextRound != null) {
        state.currentRound = writes.nextRound
      }
      return { tournament: state }
    },
  }

  return { state, repository }
}

// Fake room layer: server-side rooms are created full and immediately claimed,
// so a DTO factory plus always-succeeding claim/mark stubs stand in for the
// database without changing what the bridge exercises.
const createRoomFakes = () => {
  let nextRoomId = 100
  const closedGameIds = []
  const reopenedGameIds = []
  const stubs = [
    [
      roomService,
      'createRoomForMatch',
      async ({ name, playerIds }) => ({
        id: nextRoomId++,
        name,
        capacity: playerIds.length,
        status: 'OPEN',
        owner: { userId: playerIds[0], username: `player${playerIds[0]}` },
        players: playerIds.map((userId) => ({
          userId,
          username: `player${userId}`,
        })),
      }),
    ],
    [roomService, 'leaveOpenRoom', async () => null],
    [roomService, 'claimRoomForGame', async () => true],
    [roomService, 'markRoomInGame', async (roomId) => ({ id: roomId })],
    [
      roomService,
      'closeRoomsForGame',
      async (gameId) => {
        closedGameIds.push(gameId)
        return true
      },
    ],
    [
      roomService,
      'reopenRoomForSurvivors',
      async (gameId) => {
        reopenedGameIds.push(gameId)
        return { room: { id: 1 }, reopened: true }
      },
    ],
    [roomService, 'closeOpenRoomById', async () => null],
    [roomService, 'listRooms', async () => []],
  ]
  return { stubs, closedGameIds, reopenedGameIds }
}

const createPersistenceFake = () => {
  const persisted = []
  const stub = [
    gameService,
    'persistGameResult',
    async (game) => {
      persisted.push(game)
      return { id: persisted.length }
    },
  ]
  return { stub, persisted }
}

// One io for the whole file: the bridge subscribes once (module-scoped guard)
// and keeps this io for every test; each test resets the emit log instead.
const io = createRecordingIo()
initTournamentBridge(io)
const checkGameEnd = socketHandlers.createCheckGameEnd(io)

// The bridge serializes all of a tournament's work through one FIFO, so an
// empty enqueued action resolving means every queued advancement has settled.
const drainBridge = (tournamentId) =>
  enqueueRoomAction(`tournament:${tournamentId}`, async () => {})

const finishGame = async (liveGameId, winnerId) => {
  const engine = gameStore.getEngine(liveGameId)
  engine.winner = winnerId
  await checkGameEnd(liveGameId, engine)
}

// Whatever a test leaves in flight must not keep timers armed after it.
const teardownLiveGames = async () => {
  const games = await gameStore.getAllGames()
  for (const game of games) {
    turnTimers.clearTurnTimer(game.id)
    gameStore.deleteEngine(game.id)
    await gameStore.deleteGame(game.id)
  }
}

describe('tournament bridge (#456)', () => {
  it('plays a 4-player bracket to a champion through the room flow', async () => {
    io.emitted.length = 0
    const { state, repository } = createTournamentFixture({
      playerIds: [10, 20, 30, 40],
    })
    const rooms = createRoomFakes()
    const persistence = createPersistenceFake()

    await withStubs(
      [
        ...rooms.stubs,
        persistence.stub,
        ...Object.keys(repository).map((key) => [
          tournamentRepository,
          key,
          repository[key],
        ]),
      ],
      async () => {
        try {
          await tournamentService.startTournament({ id: 10 }, state.id, {
            shuffle: identityShuffle,
          })
          await drainBridge(state.id)

          // Round 1: both matches got a live game, the final did not.
          const [semiOne, semiTwo, final] = state.matches
          assert.ok(semiOne.liveGameId)
          assert.ok(semiTwo.liveGameId)
          assert.equal(final.liveGameId, null)

          // Both players of each pairing were pulled into their game.
          const gameStarts = io.emitted.filter(
            (record) => record.event === 'game_start',
          )
          assert.deepEqual(gameStarts.map((record) => record.room).sort(), [
            'user:10',
            'user:20',
            'user:30',
            'user:40',
          ])

          // Semifinals: 20 beats 10, then 30 beats 40. Each result closes the
          // match's room and, once both are in, seats and starts the final.
          await finishGame(semiOne.liveGameId, 20)
          await drainBridge(state.id)
          assert.equal(final.playerAId, 20)
          assert.equal(final.liveGameId, null)

          await finishGame(semiTwo.liveGameId, 30)
          await drainBridge(state.id)
          assert.equal(final.playerBId, 30)
          assert.ok(final.liveGameId)

          // Final: 30 takes the tournament.
          await finishGame(final.liveGameId, 30)
          await drainBridge(state.id)

          assert.equal(state.status, 'COMPLETED')
          assert.equal(state.winnerId, 30)

          // The persisted Game rows were stamped onto their matches in order.
          assert.deepEqual(
            state.matches.map((match) => match.gameId),
            [1, 2, 3],
          )

          // Elimination order follows the results: 10 out first, then 40,
          // then the runner-up 20; the champion is never eliminated.
          const eliminatedAt = (userId) =>
            state.players.find((player) => player.userId === userId)
              .eliminatedAt
          assert.ok(eliminatedAt(10) < eliminatedAt(40))
          assert.ok(eliminatedAt(40) < eliminatedAt(20))
          assert.equal(eliminatedAt(30), null)

          // Every match's room was closed once its game ended.
          assert.deepEqual(rooms.closedGameIds, [
            semiOne.liveGameId,
            semiTwo.liveGameId,
            final.liveGameId,
          ])
          assert.equal(rooms.reopenedGameIds.length, 0)
        } finally {
          await teardownLiveGames()
        }
      },
    )
  })

  it('advances the opponent and closes the room when a player abandons', async () => {
    io.emitted.length = 0
    const { state, repository } = createTournamentFixture({
      playerIds: [10, 20, 30, 40],
    })
    const rooms = createRoomFakes()
    const persistence = createPersistenceFake()

    await withStubs(
      [
        ...rooms.stubs,
        persistence.stub,
        ...Object.keys(repository).map((key) => [
          tournamentRepository,
          key,
          repository[key],
        ]),
      ],
      async () => {
        try {
          await tournamentService.startTournament({ id: 10 }, state.id, {
            shuffle: identityShuffle,
          })
          await drainBridge(state.id)
          const [semiOne] = state.matches

          // Player 10 walks out of the first semifinal.
          await socketHandlers.abandonActiveGame(io, 10)
          await drainBridge(state.id)

          // The opponent advances by forfeit, carrying the abandoned game's
          // persisted row onto the match.
          assert.equal(semiOne.winnerId, 20)
          assert.equal(semiOne.gameId, 1)
          assert.equal(state.matches[2].playerAId, 20)

          // Tournament rooms close instead of reopening for a rematch, and
          // the table is told there is none.
          assert.deepEqual(rooms.closedGameIds, [semiOne.liveGameId])
          assert.equal(rooms.reopenedGameIds.length, 0)
          const gameOver = io.emitted.find(
            (record) => record.event === 'game_over',
          )
          assert.equal(gameOver.room, `game:${semiOne.liveGameId}`)
          assert.equal(gameOver.payload.rematch, false)
          assert.equal(gameOver.payload.abandonedBy, 10)
        } finally {
          await teardownLiveGames()
        }
      },
    )
  })

  it('leaves casual games untouched: no match, no bracket writes', async () => {
    io.emitted.length = 0
    const rooms = createRoomFakes()
    const persistence = createPersistenceFake()
    const bracketWrites = []

    await withStubs(
      [
        ...rooms.stubs,
        persistence.stub,
        [tournamentRepository, 'findMatchByLiveGameId', async () => null],
        [
          tournamentRepository,
          'applyMatchResult',
          async (...args) => {
            bracketWrites.push(args)
            return { error: TOURNAMENT_ERRORS.NOT_FOUND }
          },
        ],
      ],
      async () => {
        try {
          const match = await matchmaking.createMatch([
            { userId: 1, username: 'casual1' },
            { userId: 2, username: 'casual2' },
          ])
          await finishGame(match.gameId, 2)

          assert.equal(bracketWrites.length, 0)
          const gameOver = io.emitted.find(
            (record) => record.event === 'game_over',
          )
          assert.equal(gameOver.payload.winnerUserId, 2)
          // The casual completion still persisted and closed its room.
          assert.equal(persistence.persisted.length, 1)
          assert.deepEqual(rooms.closedGameIds, [match.gameId])
        } finally {
          await teardownLiveGames()
        }
      },
    )
  })
})
