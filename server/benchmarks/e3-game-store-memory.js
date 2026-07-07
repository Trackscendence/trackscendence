#!/usr/bin/env node
// E3 - game-store memory and scan cost (audit finding B1).
//
// B1: finished games were never removed from the in-memory store, so
// `activeGames` grew without bound and `findActiveGameByUser` (a linear scan
// run on every socket connect/disconnect) became O(all-games-ever). The fix
// calls deleteGame on the terminal paths.
//
// This exercises the real store module both ways and samples the three signals
// that separate the leak from the fix:
//   - activeGames size (the unambiguous one)
//   - findActiveGameByUser latency (the scan that ran per connection)
//   - process RSS (noisy, reported for context)
//
// Usage:
//   node server/benchmarks/e3-game-store-memory.js [--games=5000] [--sample=500] [--leak]
//
// --leak skips deleteGame to reproduce the pre-fix behavior. Run once with
// --leak and once without and compare: fixed stays flat, leak grows linearly.

const { performance } = require('node:perf_hooks')
const store = require('#modules/game/game.store')

const parseArg = (name, fallback) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return match ? Number(match.split('=')[1]) : fallback
}

const GAMES = parseArg('games', 5000)
const SAMPLE_EVERY = parseArg('sample', 500)
const LEAK = process.argv.includes('--leak')
const SCAN_ITERATIONS = 200
const ABSENT_USER_ID = -1 // never seated, so the scan always walks the whole map

const megabytes = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10

// Time a worst-case findActiveGameByUser (a user that is never present, so the
// scan cannot short-circuit). Report the median over several calls in
// microseconds.
const measureScanMicros = async () => {
  const samples = []
  for (let iteration = 0; iteration < SCAN_ITERATIONS; iteration += 1) {
    const start = performance.now()
    await store.findActiveGameByUser(ABSENT_USER_ID, { status: 'IN_PROGRESS' })
    samples.push((performance.now() - start) * 1000)
  }
  samples.sort((first, second) => first - second)
  return Math.round(samples[Math.floor(samples.length / 2)] * 100) / 100
}

const buildGameState = (gameId, userId) => ({
  id: gameId,
  status: 'IN_PROGRESS',
  startedAt: new Date(),
  winner: null,
  players: [
    { userId, hand: new Array(7).fill('r5') },
    { userId: userId + GAMES, hand: new Array(7).fill('g2') },
  ],
})

const run = async () => {
  console.log(
    `E3 game-store memory - mode=${LEAK ? 'LEAK (pre-fix)' : 'FIXED'} ` +
      `games=${GAMES} sample=${SAMPLE_EVERY}`,
  )
  console.log('games\tsize\tscan_us\trss_mb')

  const samples = []

  for (let gameIndex = 0; gameIndex < GAMES; gameIndex += 1) {
    const gameId = `bench-game-${gameIndex}`
    const userId = gameIndex

    await store.saveGame(gameId, buildGameState(gameId, userId))
    store.setEngine(gameId, { gameId, moves: [] })

    // Terminal path: the game finishes and is flushed to the DB. The fix
    // deletes it here; the leak leaves it in the map forever.
    if (!LEAK) {
      await store.deleteGame(gameId)
      store.deleteEngine(gameId)
    }

    const isSamplePoint =
      (gameIndex + 1) % SAMPLE_EVERY === 0 || gameIndex + 1 === GAMES
    if (isSamplePoint) {
      const size = (await store.getAllGames()).length
      const scanMicros = await measureScanMicros()
      const rssMb = megabytes(process.memoryUsage().rss)
      samples.push({ games: gameIndex + 1, size, scanMicros, rssMb })
      console.log(`${gameIndex + 1}\t${size}\t${scanMicros}\t${rssMb}`)
    }
  }

  const first = samples[0]
  const last = samples[samples.length - 1]
  console.log('')
  console.log(
    `Result: size ${first.size} -> ${last.size}, ` +
      `scan ${first.scanMicros}us -> ${last.scanMicros}us, ` +
      `rss ${first.rssMb}MB -> ${last.rssMb}MB`,
  )
  if (LEAK) {
    console.log(
      'Expected in LEAK mode: size and scan grow roughly linearly with games.',
    )
  } else {
    console.log(
      'Expected in FIXED mode: size stays ~0 and scan stays flat regardless of games.',
    )
  }
}

run().catch((error) => {
  console.error('E3 failed:', error)
  process.exitCode = 1
})
