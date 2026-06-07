
const bcrypt = require('bcrypt')
const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const authRepository = require('#modules/auth/auth.repository')
const authToken = require('#modules/auth/auth.token')

const PASSWORD_MIN_LENGTH = 8
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AUTHENTICATION_REQUIRED_MESSAGE = 'Authentication required'
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email/username or password'
const INVALID_TOKEN_MESSAGE = 'Invalid or expired token'

const MAX_LOGIN_ATTEMPTS = 8
const LOCK_DURATION_MINUTES = 2

const USERNAME_MIN_LENGTH = 8
const USERNAME_MAX_LENGTH = 20

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

const normalizeEmail = (email) => email.trim().toLowerCase()
const normalizeIdentifier = (identifier) => {
  const trimmedIdentifier = identifier.trim().toLowerCase()

  return trimmedIdentifier.includes('@')
    ? trimmedIdentifier.toLowerCase()
    : trimmedIdentifier
}

const toSafeAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
})

const validateRegistrationInput = ({ email, username, password } = {}) => {
  const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : ''
  const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  const normalizedPassword = typeof password === 'string' ? password : ''
  const details = []

  if (!normalizedEmail) {
    details.push('Email is required')
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    details.push('Email must be valid')
  }

  if (!normalizedUsername) {
    details.push('Username is required')
  } else if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    details.push(`Username must be at least ${USERNAME_MIN_LENGTH} characters`)
  } else if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
    details.push(`Username must be at most ${USERNAME_MAX_LENGTH} characters`)
  } else if (!USERNAME_REGEX.test(normalizedUsername)) {
    details.push(`Username must only contain letters, numbers, underscores, and hyphens`)
  }


  if (!normalizedPassword) {
    details.push('Password is required')
  } else if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    details.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return {
    email: normalizedEmail,
    username: normalizedUsername,
    password: normalizedPassword,
  }
}

const validateLoginInput = ({ identifier, password } = {}) => {
  const normalizedIdentifier =
    typeof identifier === 'string' ? normalizeIdentifier(identifier) : ''
  const normalizedPassword = typeof password === 'string' ? password : ''
  const details = []

  if (!normalizedIdentifier) {
    details.push('Identifier is required')
  }

  if (!normalizedPassword) {
    details.push('Password is required')
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return {
    identifier: normalizedIdentifier,
    password: normalizedPassword,
  }
}

const isUniqueConstraintError = (error) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

const getUniqueConflictMessage = (error) => {
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target[0]
    : error.meta?.target

  if (target === 'email') {
    return 'Email is already registered'
  }

  if (target === 'username') {
    return 'Username is already taken'
  }

  return 'User already exists'
}

const register = async (payload) => {
  const { email, username, password } = validateRegistrationInput(payload)

  const existingEmail = await authRepository.findByEmail(email)
  if (existingEmail) {
    throw new ConflictException('Email is already registered')
  }

  const existingUsername = await authRepository.findByUsername(username)
  if (existingUsername) {
    throw new ConflictException('Username is already taken')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    return await authRepository.createUser({
      email,
      username,
      passwordHash,
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(getUniqueConflictMessage(error))
    }

    throw error
  }
}

const login = async (payload) => {
  const { identifier, password } = validateLoginInput(payload)
  const user = await authRepository.findByIdentifier(identifier)

  if (!user) {
    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
  	throw new UnauthorizedException('Account temporarily locked')
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)

  if (!isValidPassword) {
    const attempts = user.failedLoginAttempts + 1

	if (attempts >= MAX_LOGIN_ATTEMPTS) {
	  await authRepository.updateUser(user.id, {
	    failedLoginAttempts: 0,
		lockedUntil: new Date(
		  Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
		),
	  })
	} else {
	  await authRepository.updateUser(user.id, {
	    failedLoginAttempts: attempts,
	  })
	}

    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)
  }

  await authRepository.updateUser(user.id, {
    failedLoginAttempts: 0,
	lockedUntil: null,
  })

  const token = authToken.signAccessToken(user)

  return {
    token,
    user: toSafeAuthUser(user),
  }
}

const getUserFromToken = async (token) => {
  let payload

  try {
    payload = authToken.verifyAccessToken(token)
  } catch (error) {
    if (authToken.isTokenError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }

  const userId = Number(payload.sub)

  if (!Number.isInteger(userId)) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  const user = await authRepository.findSafeById(userId)

  if (!user) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  return user
}

const getAuthenticatedUser = async (authorizationHeader) => {
  const token = authToken.getBearerToken(authorizationHeader)

  if (!token) {
    throw new UnauthorizedException(AUTHENTICATION_REQUIRED_MESSAGE)
  }

  return await getUserFromToken(token)
}

module.exports = {
  INVALID_CREDENTIALS_MESSAGE,
  getUserFromToken,
  getAuthenticatedUser,
  register,
  login,
  toSafeAuthUser,
}
