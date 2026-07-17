const prisma = require('#db/prisma')
const { escapeLikePattern } = require('#modules/users/users.repository')

const adminUserSelect = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  avatarUrl: true,
  role: true,
  status: true,
  suspendedUntil: true,
  createdAt: true,
  gamesPlayed: true,
  wins: true,
}

const ADMIN_MUTATION_ERRORS = Object.freeze({
  LAST_ADMIN: 'LAST_ADMIN',
})

const SERIALIZATION_CONFLICT_CODE = 'P2034'
const MAX_TRANSACTION_ATTEMPTS = 3

const runSerializable = async (operation) => {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: 'Serializable',
      })
    } catch (error) {
      if (
        error.code !== SERIALIZATION_CONFLICT_CODE ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error
      }
    }
  }
}

const changeUserRole = (actorId, targetId, role) => {
  return runSerializable(async (tx) => {
    const target = await tx.user.findFirst({
      where: { id: targetId, deletedAt: null, isBot: false },
      select: adminUserSelect,
    })

    if (!target) {
      return null
    }
    if (target.role === role) {
      return { user: target }
    }
    if (target.role === 'ADMIN' && role === 'USER') {
      const adminCount = await tx.user.count({
        where: { role: 'ADMIN', deletedAt: null, isBot: false },
      })

      if (adminCount <= 1) {
        return { error: ADMIN_MUTATION_ERRORS.LAST_ADMIN }
      }
    }

    const user = await tx.user.update({
      where: { id: targetId },
      data: {
        role,
        tokenVersion: { increment: 1 },
      },
      select: adminUserSelect,
    })

    await tx.adminAuditLog.create({
      data: {
        actorId,
        targetId,
        action: 'ROLE_CHANGED',
        metadata: {
          previousRole: target.role,
          newRole: role,
        },
      },
    })

    return { user }
  })
}

const findUserDetail = (id) => {
  return prisma.user.findFirst({
    where: { id, deletedAt: null, isBot: false },
    select: {
      ...adminUserSelect,
      statusReason: true,
      statusUpdatedAt: true,
      adminAuditLogsTargeted: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
        select: {
          id: true,
          action: true,
          reason: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  })
}

const listUsers = async ({ query, status, role, limit, offset }) => {
  const escapedQuery = escapeLikePattern(query)
  const where = {
    deletedAt: null,
    isBot: false,
    ...(status ? { status } : {}),
    ...(role ? { role } : {}),
    ...(escapedQuery
      ? {
          OR: [
            { username: { contains: escapedQuery, mode: 'insensitive' } },
            { displayName: { contains: escapedQuery, mode: 'insensitive' } },
            { email: { contains: escapedQuery, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit,
      select: adminUserSelect,
    }),
    prisma.user.count({ where }),
  ])

  return { users, totalCount }
}

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
  ADMIN_MUTATION_ERRORS,
  adminUserSelect,
  changeUserRole,
  findUserDetail,
  getStats,
  listUsers,
}
