const { Prisma } = require('@prisma/client')

// Refreshers for the denormalized stat columns on User (gamesPlayed, wins,
// losses, rank). They are the single write path for those counters: the
// production save path runs them inside the save transaction, and the dev
// seed runs them after rebuilding seeded history (#396), so counters can
// never drift from the Game/GamePlayer rows they summarize.
//
// Every function takes the Prisma client or transaction to run against as its
// first argument, so callers decide the transaction boundary.

const updateLifetimeStatsForUsers = async (tx, userIds) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Number.isInteger)

  if (uniqueUserIds.length === 0) {
    return
  }

  // LEFT JOIN so a user whose game rows were all removed (the seed does this
  // when it rebuilds history) lands on zero instead of keeping stale counters
  // from before the removal.
  await tx.$executeRaw`
    UPDATE "User" u
    SET
      "gamesPlayed" = stats."gamesPlayed",
      "wins" = stats."wins",
      "losses" = stats."losses"
    FROM (
      SELECT
        target."id" AS "userId",
        CAST(COUNT(gp."id") AS INTEGER) AS "gamesPlayed",
        CAST(
          COUNT(*) FILTER (WHERE gp."isWinner" = true) AS INTEGER
        ) AS "wins",
        CAST(
          COUNT(*) FILTER (
            WHERE gp."isWinner" = false AND g."status" = 'COMPLETED'
          ) AS INTEGER
        ) AS "losses"
      FROM "User" target
      LEFT JOIN "GamePlayer" gp ON gp."userId" = target."id"
      LEFT JOIN "Game" g ON g."id" = gp."gameId"
      WHERE target."id" IN (${Prisma.join(uniqueUserIds)})
      GROUP BY target."id"
    ) stats
    WHERE u."id" = stats."userId"
  `
}

const refreshUserRanks = async (tx) => {
  await tx.$executeRaw`
    WITH ranked_users AS (
      SELECT
        u."id",
        CAST(
          ROW_NUMBER() OVER (
            ORDER BY
              u."wins" DESC,
              u."losses" ASC,
              u."gamesPlayed" DESC,
              u."username" ASC
          ) AS INTEGER
        ) AS "computedRank"
      FROM "User" u
      WHERE u."gamesPlayed" > 0
    )
    UPDATE "User" u
    SET "rank" = ranked_users."computedRank"
    FROM ranked_users
    WHERE u."id" = ranked_users."id"
  `

  // Users with no games are excluded from the ranking window above, so their
  // previous rank would survive a recompute. Clear it: no games, no rank.
  await tx.$executeRaw`
    UPDATE "User"
    SET "rank" = NULL
    WHERE "gamesPlayed" = 0 AND "rank" IS NOT NULL
  `
}

module.exports = {
  refreshUserRanks,
  updateLifetimeStatsForUsers,
}
