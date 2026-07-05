const prisma = require('#db/prisma')

const apiKeySelect = {
  id: true,
  name: true,
  keyPrefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
}

const createApiKey = ({ userId, name, keyHash, keyPrefix }) => {
  return prisma.apiKey.create({
    data: { userId, name, keyHash, keyPrefix },
    select: apiKeySelect,
  })
}

const listApiKeysForUser = (userId) => {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: apiKeySelect,
  })
}

const countActiveApiKeysForUser = (userId) => {
  return prisma.apiKey.count({
    where: { userId, revokedAt: null },
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
  countActiveApiKeysForUser,
  createApiKey,
  findActiveApiKeyByHash,
  listApiKeysForUser,
  revokeApiKeyForUser,
  touchApiKeyLastUsed,
}
