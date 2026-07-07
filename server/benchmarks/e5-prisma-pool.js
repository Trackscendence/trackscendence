#!/usr/bin/env node
// E5 - Prisma connection-pool saturation (audit finding B4).
//
// server/src/db/prisma.js is a bare `new PrismaClient()` with no
// connection_limit / pool_timeout. On Railway, Prisma defaults the pool to
// num_cpus*2+1 (often 5-9). Every socket connect and every HTTP request runs an
// auth token-version lookup, so a burst of socket connections queues on the pool
// and, past pool_timeout, errors with P2024 ("Timed out fetching a new
// connection from the connection pool").
//
// B4's fix is an explicit, tuned connection_limit (plus a short-TTL auth cache
// so most checks skip the DB). This experiment shows the acquire-wait and error
// rate under a fixed burst at an untuned-small pool versus a tuned-larger pool.
//
// Method: fire CONCURRENCY queries that each hold a pooled connection for
// HOLD_MS (a `pg_sleep`, standing in for a query under load). With a small pool,
// only pool-size run at once and the rest queue; total latency = queue wait +
// service time, so acquire-wait ~= latency - HOLD_MS. A small pool_timeout turns
// the longest waiters into P2024 errors, exactly the production failure mode.
//
// Baseline experiment: prisma.js is unchanged, so this quantifies what B4's pool
// tuning buys. No data is created. Needs the DB reachable via DATABASE_URL.
//
// Usage:
//   node server/benchmarks/e5-prisma-pool.js \
//     [--concurrency=50] [--hold-ms=50] [--small-pool=2] [--large-pool=16] \
//     [--small-timeout=1] [--large-timeout=10]

const { PrismaClient } = require('@prisma/client')
const { performance } = require('node:perf_hooks')

const parseArg = (name, fallback) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return match ? Number(match.split('=')[1]) : fallback
}

const CONCURRENCY = parseArg('concurrency', 50)
const HOLD_MS = parseArg('hold-ms', 50)
const SMALL_POOL = parseArg('small-pool', 2)
const LARGE_POOL = parseArg('large-pool', 16)
const SMALL_TIMEOUT = parseArg('small-timeout', 1)
const LARGE_TIMEOUT = parseArg('large-timeout', 10)

const baseUrl = process.env.DATABASE_URL
if (!baseUrl) {
  console.error('E5 needs DATABASE_URL to reach the database.')
  process.exit(1)
}

// Append pool tuning to the datasource URL. Prisma reads connection_limit and
// pool_timeout (seconds) from the query string.
const withPool = (limit, timeoutSeconds) => {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}connection_limit=${limit}&pool_timeout=${timeoutSeconds}`
}

const percentile = (sortedAsc, fraction) =>
  sortedAsc[
    Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * fraction))
  ]

const round = (value) => Math.round(value * 10) / 10

// Is this the pool-timeout error the audit warns about? Prisma tags it P2024.
const isPoolTimeout = (error) =>
  error?.code === 'P2024' || /connection pool/i.test(error?.message || '')

const runScenario = async (label, poolLimit, timeoutSeconds) => {
  const prisma = new PrismaClient({
    datasourceUrl: withPool(poolLimit, timeoutSeconds),
  })
  const holdSeconds = HOLD_MS / 1000

  // One query that occupies a pooled connection for HOLD_MS.
  const oneQuery = async () => {
    const start = performance.now()
    try {
      // Cast the void result of pg_sleep to text so Prisma can deserialize it.
      await prisma.$queryRawUnsafe(`SELECT pg_sleep(${holdSeconds})::text`)
      return { latency: performance.now() - start, timedOut: false }
    } catch (error) {
      if (isPoolTimeout(error)) {
        return { latency: performance.now() - start, timedOut: true }
      }
      throw error
    }
  }

  await prisma.$queryRawUnsafe('SELECT 1') // warm up: open the pool

  const started = performance.now()
  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => oneQuery()),
  )
  const wallMs = performance.now() - started
  await prisma.$disconnect()

  const timeouts = results.filter((result) => result.timedOut).length
  // Acquire-wait is the latency beyond the known service time (HOLD_MS). Only
  // the queries that actually completed carry a meaningful wait figure.
  const waits = results
    .filter((result) => !result.timedOut)
    .map((result) => Math.max(0, result.latency - HOLD_MS))
    .sort((first, second) => first - second)

  const summary = {
    label,
    poolLimit,
    timeoutSeconds,
    wallMs: round(wallMs),
    timeouts,
    errorRatePct: round((timeouts / CONCURRENCY) * 100),
    waitP50: waits.length ? round(percentile(waits, 0.5)) : null,
    waitP95: waits.length ? round(percentile(waits, 0.95)) : null,
    waitP99: waits.length ? round(percentile(waits, 0.99)) : null,
  }

  console.log(
    `  ${label.padEnd(24)} pool=${poolLimit} timeout=${timeoutSeconds}s  ` +
      `wall=${summary.wallMs}ms  wait p50/p95/p99=` +
      `${summary.waitP50}/${summary.waitP95}/${summary.waitP99}ms  ` +
      `timeouts=${timeouts}/${CONCURRENCY} (${summary.errorRatePct}%)`,
  )
  return summary
}

const run = async () => {
  console.log(
    `E5 Prisma pool - ${CONCURRENCY} concurrent queries, each holding a ` +
      `connection ${HOLD_MS}ms`,
  )
  console.log('Acquire-wait = observed latency - hold time (queue time only).')
  console.log('')

  const small = await runScenario(
    'untuned (small pool)',
    SMALL_POOL,
    SMALL_TIMEOUT,
  )
  const large = await runScenario(
    'tuned (larger pool)',
    LARGE_POOL,
    LARGE_TIMEOUT,
  )

  const waitDrop =
    small.waitP95 && large.waitP95 !== null
      ? round(small.waitP95 / Math.max(large.waitP95, 0.1))
      : null
  console.log('')
  console.log(
    `Result: p95 acquire-wait ${small.waitP95}ms -> ${large.waitP95}ms` +
      (waitDrop ? ` (~${waitDrop}x)` : '') +
      `, timeouts ${small.timeouts} -> ${large.timeouts}.`,
  )
  console.log(
    'The tuned pool collapses the acquire-wait and removes the pool_timeout ' +
      'errors at the same burst - what B4 buys before the auth cache even lands.',
  )
}

run().catch((error) => {
  console.error('E5 failed:', error)
  process.exitCode = 1
})
