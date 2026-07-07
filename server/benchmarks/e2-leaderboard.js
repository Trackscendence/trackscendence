#!/usr/bin/env node
// E2 - leaderboard: aggregation vs denormalized read (audit findings B3, I6).
//
// The live endpoint runs a JOIN GamePlayer + GROUP BY over every game row and
// sorts by a computed aggregate (no index can help), then runs a SECOND full
// aggregation just to COUNT for pagination. B3's fix serves the board straight
// from the denormalized User columns (wins/gamesPlayed/rank already maintained),
// so the read is an ordered scan of one table and the count is COUNT(*).
//
// This EXPLAIN ANALYZEs both shapes against whatever is currently seeded and
// reports median execution time plus the plan's top node, so the difference is
// measured, not asserted. Seed volume first: SEED_SCALE=10000 SEED_GAMES=250000.
//
// Baseline experiment: the denormalized path is what B3 would ship. Running it
// here shows the target before the endpoint is changed.
//
// Usage: node server/benchmarks/e2-leaderboard.js [--limit=20] [--runs=8]

const prisma = require('#db/prisma')

const parseArg = (name, fallback) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return match ? Number(match.split('=')[1]) : fallback
}

const LIMIT = parseArg('limit', 20)
const RUNS = parseArg('runs', 8)

// The current endpoint query (game.repository.js getLeaderboard), default sort.
const AGGREGATION_PAGE = `
  SELECT u.id AS "userId", u.username, u."displayName",
    CAST(COUNT(CASE WHEN gp."isWinner" = true THEN 1 END) AS INTEGER) AS "totalWins",
    CAST(COALESCE(SUM(gp.score), 0) AS INTEGER) AS "totalScore",
    CAST(COUNT(gp.id) AS INTEGER) AS "gamesPlayed"
  FROM "User" u
  JOIN "GamePlayer" gp ON u.id = gp."userId"
  GROUP BY u.id, u.username, u."displayName"
  ORDER BY "totalWins" DESC, "totalScore" DESC, u.id ASC
  LIMIT ${LIMIT} OFFSET 0
`

// B3's proposed replacement: read straight from the denormalized columns.
const DENORMALIZED_PAGE = `
  SELECT u.id AS "userId", u.username, u."displayName",
    u."wins" AS "totalWins", u."gamesPlayed"
  FROM "User" u
  WHERE u."gamesPlayed" > 0
  ORDER BY u."wins" DESC, u."gamesPlayed" DESC, u.id ASC
  LIMIT ${LIMIT} OFFSET 0
`

const AGGREGATION_COUNT = `
  SELECT CAST(COUNT(*) AS INTEGER) AS "totalCount" FROM (
    SELECT u.id FROM "User" u
    JOIN "GamePlayer" gp ON u.id = gp."userId"
    GROUP BY u.id
  ) AS players
`

const DENORMALIZED_COUNT = `
  SELECT CAST(COUNT(*) AS INTEGER) AS "totalCount"
  FROM "User" u WHERE u."gamesPlayed" > 0
`

const explain = async (sql) => {
  const rows = await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
  )
  // Postgres returns a single row whose "QUERY PLAN" is the parsed JSON plan.
  const planWrapper = rows[0]['QUERY PLAN']
  return Array.isArray(planWrapper) ? planWrapper[0] : planWrapper
}

const measure = async (label, sql) => {
  await explain(sql) // warm up (cold cache/plan cache)
  const times = []
  let plan = null
  for (let run = 0; run < RUNS; run += 1) {
    plan = await explain(sql)
    times.push(plan['Execution Time'])
  }
  times.sort((first, second) => first - second)
  const median = Math.round(times[Math.floor(times.length / 2)] * 100) / 100
  const node = plan.Plan['Node Type']
  const planRows = plan.Plan['Actual Rows']
  return { label, median, node, planRows }
}

const printPair = (title, current, proposed) => {
  const speedup = Math.round((current.median / proposed.median) * 10) / 10
  console.log(`\n${title}`)
  console.log(
    `  current (aggregation):   ${String(current.median).padStart(8)} ms  ` +
      `top=${current.node}`,
  )
  console.log(
    `  denormalized (B3 target):${String(proposed.median).padStart(8)} ms  ` +
      `top=${proposed.node}`,
  )
  console.log(`  speedup: ${speedup}x`)
}

const run = async () => {
  const userCount = await prisma.user.count()
  const playerCount = await prisma.gamePlayer.count()
  console.log(
    `E2 leaderboard - ${userCount} users, ${playerCount} game-player rows, ` +
      `limit=${LIMIT}, runs=${RUNS} (median of EXPLAIN ANALYZE)`,
  )

  const pageCurrent = await measure('page/aggregation', AGGREGATION_PAGE)
  const pageDenormalized = await measure('page/denormalized', DENORMALIZED_PAGE)
  const countCurrent = await measure('count/aggregation', AGGREGATION_COUNT)
  const countDenormalized = await measure(
    'count/denormalized',
    DENORMALIZED_COUNT,
  )

  printPair('Page query (leaderboard rows):', pageCurrent, pageDenormalized)
  printPair('Count query (pagination total):', countCurrent, countDenormalized)

  console.log(
    '\nNote: the endpoint runs BOTH the page and count aggregations per request ' +
      '(Promise.all), so the current per-request DB cost is their sum.',
  )
}

run()
  .catch((error) => {
    console.error('E2 failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
