const prisma = require('#db/prisma')

const apiKeySelect = {
  id: true,
  name: true,
  keyPrefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
}

const listApiKeysForUser = (userId) => {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: apiKeySelect,
  })
}

// Namespace for pg_advisory_xact_lock so API key locks cannot collide with
// advisory locks other features may take on the same user id.
const API_KEY_LOCK_NAMESPACE = 4201

// The count check and the insert run in one transaction behind a per-user
// advisory lock, so concurrent creates cannot both pass the limit check.
// Returns null when the user is already at maxActiveKeys.
const createApiKeyIfUnderLimit = ({
  userId,
  name,
  keyHash,
  keyPrefix,
  maxActiveKeys,
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${API_KEY_LOCK_NAMESPACE}::int, ${userId}::int)`

    const activeKeyCount = await tx.apiKey.count({
      where: { userId, revokedAt: null },
    })

    if (activeKeyCount >= maxActiveKeys) {
      return null
    }

    return tx.apiKey.create({
      data: { userId, name, keyHash, keyPrefix },
      select: apiKeySelect,
    })
  })
}

const findActiveApiKeyByHash = (keyHash) => {
  return prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
        },
      },
    },
  })
}

const revokeApiKeyForUser = (userId, apiKeyId) => {
  return prisma.apiKey.updateMany({
    where: { id: apiKeyId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

const touchApiKeyLastUsed = (apiKeyId) => {
  return prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: new Date() },
    select: { id: true },
  })
}

module.exports = {
  createApiKeyIfUnderLimit,
  findActiveApiKeyByHash,
  listApiKeysForUser,
  revokeApiKeyForUser,
  touchApiKeyLastUsed,
}
