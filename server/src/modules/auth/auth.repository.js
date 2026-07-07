const prisma = require('#db/prisma')

const safeUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  gamesPlayed: true,
  wins: true,
  losses: true,
  rank: true,
  isGuest: true,
  role: true,
  createdAt: true,
  termsAcceptedAt: true,
  privacyAcceptedAt: true,
  twoFactorEnabled: true,
}

const tokenUserSelect = {
  ...safeUserSelect,
  tokenVersion: true,
  twoFactorChallengeVersion: true,
  twoFactorPendingSecretCiphertext: true,
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

const twoFactorFields = {
  twoFactorSecretCiphertext: true,
  twoFactorPendingSecretCiphertext: true,
}

const lockoutFields = {
  failedLoginCount: true,
  lockedOutUntil: true,
}

const authUserSelect = {
  ...tokenUserSelect,
  passwordHash: true,
  ...twoFactorFields,
  ...lockoutFields,
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

const createUser = ({
  email,
  username,
  passwordHash,
  privacyAcceptedAt,
  termsAcceptedAt,
}) => {
  return prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      privacyAcceptedAt,
      termsAcceptedAt,
    },
    select: registeredUserSelect,
  })
}

const findByFortyTwoId = (fortyTwoId) => {
  return prisma.user.findUnique({
    where: { fortyTwoId },
    select: authUserSelect,
  })
}

const linkFortyTwoId = (id, fortyTwoId) => {
  return prisma.user.update({
    where: { id },
    data: { fortyTwoId },
    select: authUserSelect,
  })
}

const createFortyTwoUser = ({
  email,
  username,
  fortyTwoId,
  displayName,
  avatarUrl,
}) => {
  return prisma.user.create({
    data: {
      email,
      username,
      fortyTwoId,
      displayName,
      avatarUrl,
    },
    select: authUserSelect,
  })
}

const createGuestUser = ({ email, username, displayName }) => {
  return prisma.user.create({
    data: {
      email,
      username,
      displayName,
      isGuest: true,
    },
    select: authUserSelect,
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
    select: {
      ...tokenUserSelect,
      deletedAt: true,
    },
  })
}

const withLockedPasswordResetToken = (tokenId, callback) => {
  return prisma.$transaction(async (tx) => {
    const users = await tx.$queryRaw`
      SELECT
        "id",
        "email",
        "username",
        "displayName",
        "bio",
        "createdAt",
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

const replacePendingTwoFactorSetup = async (
  id,
  pendingSecretCiphertext,
  recoveryCodeHashes,
) => {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        twoFactorPendingSecretCiphertext: pendingSecretCiphertext,
      },
    })

    await tx.userTwoFactorRecoveryCode.deleteMany({
      where: {
        userId: id,
        isPending: true,
      },
    })

    await tx.userTwoFactorRecoveryCode.createMany({
      data: recoveryCodeHashes.map((codeHash) => ({
        userId: id,
        codeHash,
        isPending: true,
      })),
    })
  })
}

const activatePendingTwoFactorSetup = async (id, activeSecretCiphertext) => {
  await prisma.$transaction(async (tx) => {
    await tx.userTwoFactorRecoveryCode.deleteMany({
      where: {
        userId: id,
        isPending: false,
      },
    })

    await tx.userTwoFactorRecoveryCode.updateMany({
      where: {
        userId: id,
        isPending: true,
      },
      data: {
        isPending: false,
      },
    })

    await tx.user.update({
      where: { id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecretCiphertext: activeSecretCiphertext,
        twoFactorPendingSecretCiphertext: null,
      },
    })
  })
}

const clearTwoFactorById = async (id) => {
  await prisma.$transaction(async (tx) => {
    await tx.userTwoFactorRecoveryCode.deleteMany({
      where: { userId: id },
    })

    await tx.user.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecretCiphertext: null,
        twoFactorPendingSecretCiphertext: null,
      },
    })
  })
}

const consumeRecoveryCode = async (userId, codeHash) => {
  const result = await prisma.userTwoFactorRecoveryCode.deleteMany({
    where: {
      userId,
      codeHash,
      isPending: false,
    },
  })

  return result.count > 0
}

const issueTwoFactorChallenge = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorChallengeVersion: {
        increment: 1,
      },
    },
    select: {
      id: true,
      tokenVersion: true,
      twoFactorChallengeVersion: true,
    },
  })
}

const consumeTwoFactorChallenge = async (userId, challengeVersion) => {
  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      twoFactorChallengeVersion: challengeVersion,
    },
    data: {
      twoFactorChallengeVersion: {
        increment: 1,
      },
    },
  })

  return result.count > 0
}

const consumeRecoveryCodeAndChallenge = async (
  userId,
  codeHash,
  challengeVersion,
) => {
  try {
    await prisma.$transaction(async (tx) => {
      const challengeResult = await tx.user.updateMany({
        where: {
          id: userId,
          twoFactorChallengeVersion: challengeVersion,
        },
        data: {
          twoFactorChallengeVersion: {
            increment: 1,
          },
        },
      })

      if (challengeResult.count !== 1) {
        throw new Error('INVALID_TWO_FACTOR_CHALLENGE')
      }

      const codeResult = await tx.userTwoFactorRecoveryCode.deleteMany({
        where: {
          userId,
          codeHash,
          isPending: false,
        },
      })

      if (codeResult.count !== 1) {
        throw new Error('INVALID_TWO_FACTOR_RECOVERY_CODE')
      }
    })

    return true
  } catch (error) {
    if (
      error.message === 'INVALID_TWO_FACTOR_CHALLENGE' ||
      error.message === 'INVALID_TWO_FACTOR_RECOVERY_CODE'
    ) {
      return false
    }

    throw error
  }
}

const updateUserLoginAttempts = (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data,
  })
}

const upgradeGuestById = async (
  id,
  { email, username, passwordHash, privacyAcceptedAt, termsAcceptedAt },
) => {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id, isGuest: true, deletedAt: null },
      data: {
        email,
        username,
        passwordHash,
        privacyAcceptedAt,
        termsAcceptedAt,
        isGuest: false,
        failedLoginCount: 0,
        lockedOutUntil: null,
        tokenVersion: { increment: 1 },
      },
    })

    if (result.count !== 1) {
      return null
    }

    return await tx.user.findUnique({
      where: { id },
      select: authUserSelect,
    })
  })
}
module.exports = {
  activatePendingTwoFactorSetup,
  clearPasswordResetToken,
  clearTwoFactorById,
  consumeRecoveryCode,
  consumeRecoveryCodeAndChallenge,
  consumeTwoFactorChallenge,
  createFortyTwoUser,
  createGuestUser,
  createUser,
  findAuthById,
  findByEmail,
  findByFortyTwoId,
  findByIdentifier,
  findByPasswordResetTokenId,
  findByUsername,
  findSafeById,
  findTokenUserById,
  issueTwoFactorChallenge,
  linkFortyTwoId,
  replacePendingTwoFactorSetup,
  updatePasswordById,
  updatePasswordByIdInTransaction,
  updatePasswordResetToken,
  upgradeGuestById,
  withLockedPasswordResetToken,
  updateUserLoginAttempts,
}
