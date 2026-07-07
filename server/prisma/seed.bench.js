#!/usr/bin/env node
// Scale seed for the performance harness.
//
// The dev seed (seed.js) creates a handful of rows, which hides the findings
// that only bite at volume (the leaderboard aggregation, the rank recompute,
// the room broadcast). This seeds realistic volume so E2/E5/E6 measure the real
// plan and latency instead of a 10-row toy.
//
// It generates users with a shared password hash, optionally a pile of finished
// games with two players each, then a single raw-SQL pass that recomputes the
// denormalized User stats (gamesPlayed/wins/losses) from the generated games
// and assigns rank by wins. That keeps the aggregation path and the
// denormalized-read path in agreement, so E2's before/after is a fair compare.
//
// Never runs against production (guarded below and by NODE_ENV).
//
// Usage:
//   SEED_SCALE=10000 SEED_GAMES=250000 node server/prisma/seed.bench.js
//
// Defaults: 10000 users, 0 games (users-only is fast; set SEED_GAMES for E2).

const bcrypt = require('bcrypt')
const prisma = require('#db/prisma')

const USERS = Number(process.env.SEED_SCALE || 10000)
const GAMES = Number(process.env.SEED_GAMES || 0)
const USER_BATCH = 1000
const GAME_BATCH = 1000
const SHARED_PASSWORD = 'BenchPass123!'

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run the benchmark seed with NODE_ENV=production',
    )
  }

  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 10)
  const startedAt = Date.now()

  console.log(`Seeding ${USERS} users (batch ${USER_BATCH})...`)
  for (let offset = 0; offset < USERS; offset += USER_BATCH) {
    const batch = []
    for (
      let index = offset;
      index < Math.min(offset + USER_BATCH, USERS);
      index += 1
    ) {
      batch.push({
        email: `bench_user_${index}@bench.local`,
        username: `bench_user_${index}`,
        displayName: `Bench User ${index}`,
        passwordHash,
      })
    }
    await prisma.user.createMany({ data: batch, skipDuplicates: true })
  }

  const benchUsers = await prisma.user.findMany({
    where: { username: { startsWith: 'bench_user_' } },
    select: { id: true },
    orderBy: { id: 'asc' },
  })
  const userIds = benchUsers.map((user) => user.id)
  console.log(`Have ${userIds.length} bench users.`)

  if (GAMES > 0) {
    console.log(`Seeding ${GAMES} games (batch ${GAME_BATCH})...`)
    for (let offset = 0; offset < GAMES; offset += GAME_BATCH) {
      const count = Math.min(GAME_BATCH, GAMES - offset)
      // createManyAndReturn gives us the generated ids so the two players can
      // be attached in a second bulk insert without a per-game round trip.
      const games = await prisma.game.createManyAndReturn({
        data: Array.from({ length: count }, () => ({
          status: 'COMPLETED',
          endedAt: new Date(),
        })),
        select: { id: true },
      })

      const players = []
      games.forEach((game, position) => {
        const gameIndex = offset + position
        const first = userIds[gameIndex % userIds.length]
        // Offset the second player by a prime so pairings vary and never self-pair.
        const second = userIds[(gameIndex * 7 + 3) % userIds.length]
        const firstWon = gameIndex % 2 === 0
        players.push(
          {
            gameId: game.id,
            userId: first,
            score: firstWon ? 100 : 40,
            isWinner: firstWon,
          },
          {
            gameId: game.id,
            userId:
              second === first
                ? userIds[(gameIndex + 1) % userIds.length]
                : second,
            score: firstWon ? 35 : 100,
            isWinner: !firstWon,
          },
        )
      })
      await prisma.gamePlayer.createMany({ data: players })
    }

    console.log('Recomputing denormalized stats + rank from generated games...')
    await prisma.$executeRawUnsafe(`
      UPDATE "User" AS u
      SET "gamesPlayed" = stats.played,
          "wins" = stats.wins,
          "losses" = stats.played - stats.wins
      FROM (
        SELECT "userId",
               COUNT(*) AS played,
               COUNT(*) FILTER (WHERE "isWinner") AS wins
        FROM "GamePlayer"
        GROUP BY "userId"
      ) AS stats
      WHERE u.id = stats."userId"
    `)
  }

  // Rank by wins then gamesPlayed, matching the app's denormalized ordering.
  await prisma.$executeRawUnsafe(`
    UPDATE "User" AS u
    SET "rank" = ranked.position
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "wins" DESC, "gamesPlayed" DESC, id ASC) AS position
      FROM "User"
      WHERE "gamesPlayed" > 0
    ) AS ranked
    WHERE u.id = ranked.id
  `)

  const seconds = Math.round((Date.now() - startedAt) / 100) / 10
  console.log(
    `Bench seed complete in ${seconds}s: ${userIds.length} users, ${GAMES} games.`,
  )
}

run()
  .catch((error) => {
    console.error('Bench seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
