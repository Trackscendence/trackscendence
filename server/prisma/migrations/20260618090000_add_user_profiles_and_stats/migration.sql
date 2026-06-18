ALTER TABLE "User"
ADD COLUMN "displayName" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "wins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rank" INTEGER;

UPDATE "User" u
SET
  "gamesPlayed" = stats."gamesPlayed",
  "wins" = stats."wins",
  "losses" = stats."losses"
FROM (
  SELECT
    gp."userId" AS "userId",
    CAST(COUNT(*) AS INTEGER) AS "gamesPlayed",
    CAST(COUNT(*) FILTER (WHERE gp."isWinner" = true) AS INTEGER) AS "wins",
    CAST(
      COUNT(*) FILTER (
        WHERE gp."isWinner" = false AND g."status" = 'COMPLETED'
      ) AS INTEGER
    ) AS "losses"
  FROM "GamePlayer" gp
  JOIN "Game" g ON g."id" = gp."gameId"
  GROUP BY gp."userId"
) stats
WHERE u."id" = stats."userId";

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
WHERE u."id" = ranked_users."id";
