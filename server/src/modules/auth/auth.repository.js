const prisma = require('#db/prisma')

const updateUser = (userId, data) => {
  return prisma.user.update({
    where: {id: userId },
    data,
  })
}

const safeUserSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
}

const registeredUserSelect = {
  ...safeUserSelect,
  createdAt: true,
}

const authUserSelect = {
  ...safeUserSelect,
  passwordHash: true,
  failedLoginAttempts: true,
  lockedUntil: true,
}

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
    select: authUserSelect,
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

const findSafeById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  })
}

module.exports = {
  updateUser,
  createUser,
  findByEmail,
  findByUsername,
  findByIdentifier,
  findSafeById,
}
