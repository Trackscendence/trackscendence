const prisma = require('#db/prisma')

const safeUserSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
}

const tokenUserSelect = {
  ...safeUserSelect,
  tokenVersion: true,
}

const registeredUserSelect = {
  ...safeUserSelect,
  createdAt: true,
}

const passwordResetFields = {
  passwordResetTokenId: true,
  passwordResetTokenHash: true,
  passwordResetTokenExpiry: true,
}

const authUserSelect = {
  ...tokenUserSelect,
  passwordHash: true,
}

const authUserWithResetSelect = {
  ...authUserSelect,
  ...passwordResetFields,
}

const passwordUpdateData = (passwordHash) => ({
  passwordHash,
  passwordResetTokenId: null,
  passwordResetTokenHash: null,
  passwordResetTokenExpiry: null,
  tokenVersion: { increment: 1 },
})

const createUser = ({ email, username, passwordHash }) => {
  return prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
    select: registeredUserSelect,
  })
}

const findByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: authUserWithResetSelect,
  })
}

const findByUsername = (username) => {
  return prisma.user.findUnique({
    where: { username },
    select: authUserSelect,
  })
}

const findByIdentifier = (identifier) => {
  const where = identifier.includes('@')
    ? { email: identifier }
    : { username: identifier }

  return prisma.user.findUnique({
    where,
    select: authUserSelect,
  })
}

const findByPasswordResetTokenId = (tokenId) => {
  return prisma.user.findUnique({
    where: { passwordResetTokenId: tokenId },
    select: authUserWithResetSelect,
  })
}

const findAuthById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: authUserSelect,
  })
}

const findSafeById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  })
}

const updatePasswordById = (id, passwordHash) => {
  return prisma.user.update({
    where: { id },
    data: passwordUpdateData(passwordHash),
    select: safeUserSelect,
  })
}

const updatePasswordByIdInTransaction = (tx, id, passwordHash) => {
  return tx.user.update({
    where: { id },
    data: passwordUpdateData(passwordHash),
    select: safeUserSelect,
  })
}

const updatePasswordResetToken = (id, tokenId, tokenHash, expiry) => {
  return prisma.user.update({
    where: { id },
    data: {
      passwordResetTokenId: tokenId,
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiry: expiry,
    },
  })
}

const clearPasswordResetToken = (id) => {
  return prisma.user.update({
    where: { id },
    data: {
      passwordResetTokenId: null,
      passwordResetTokenHash: null,
      passwordResetTokenExpiry: null,
    },
  })
}

const findTokenUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: tokenUserSelect,
  })
}

const withLockedPasswordResetToken = (tokenId, callback) => {
  return prisma.$transaction(async (tx) => {
    const users = await tx.$queryRaw`
      SELECT
        "id",
        "email",
        "username",
        "role",
        "passwordHash",
        "passwordResetTokenHash",
        "passwordResetTokenExpiry",
        "tokenVersion"
      FROM "User"
      WHERE "passwordResetTokenId" = ${tokenId}
      FOR UPDATE
    `
    const user = users[0] || null

    return await callback(user, tx)
  })
}

const updateUserLoginAttempts = (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data,
  })
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findByIdentifier,
  findByPasswordResetTokenId,
  findAuthById,
  findSafeById,
  updatePasswordById,
  updatePasswordByIdInTransaction,
  updatePasswordResetToken,
  clearPasswordResetToken,
  findTokenUserById,
  withLockedPasswordResetToken,
}
