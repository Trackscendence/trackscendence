const prisma = require('#db/prisma')

const getStats = async (now = new Date()) => {
  const rows = await prisma.$queryRaw`
    WITH days AS (
      SELECT generate_series(
        DATE_TRUNC('day', CAST(${now} AS TIMESTAMP WITH TIME ZONE)) - INTERVAL '6 days',
        DATE_TRUNC('day', CAST(${now} AS TIMESTAMP WITH TIME ZONE)),
        INTERVAL '1 day'
      ) AS day
    )
    SELECT
      CAST((
        SELECT COUNT(*) FROM "User"
        WHERE "deletedAt" IS NULL AND "isBot" = false
      ) AS INTEGER) AS "totalPlayers",
      CAST((
        SELECT COUNT(*) FROM "Room" WHERE status = 'OPEN'
      ) AS INTEGER) AS "openRooms",
      CAST((
        SELECT COUNT(*) FROM "Game"
        WHERE "startedAt" >= DATE_TRUNC('day', CAST(${now} AS TIMESTAMP WITH TIME ZONE))
          AND "startedAt" < DATE_TRUNC('day', CAST(${now} AS TIMESTAMP WITH TIME ZONE)) + INTERVAL '1 day'
      ) AS INTEGER) AS "gamesToday",
      (
        SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'day', TO_CHAR(daily.day, 'YYYY-MM-DD'),
            'count', daily.count
          ) ORDER BY daily.day
        )
        FROM (
          SELECT days.day, CAST(COUNT(g.id) AS INTEGER) AS count
          FROM days
          LEFT JOIN "Game" g
            ON g."startedAt" >= days.day
           AND g."startedAt" < days.day + INTERVAL '1 day'
          GROUP BY days.day
        ) AS daily
      ) AS "gamesThisWeek",
      (
        SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'day', TO_CHAR(daily.day, 'YYYY-MM-DD'),
            'count', daily.count
          ) ORDER BY daily.day
        )
        FROM (
          SELECT days.day, CAST(COUNT(u.id) AS INTEGER) AS count
          FROM days
          LEFT JOIN "User" u
            ON u."createdAt" >= days.day
           AND u."createdAt" < days.day + INTERVAL '1 day'
           AND u."deletedAt" IS NULL
           AND u."isBot" = false
          GROUP BY days.day
        ) AS daily
      ) AS "newPlayersThisWeek"
  `

  return rows[0]
}

module.exports = {
  getStats,
}
