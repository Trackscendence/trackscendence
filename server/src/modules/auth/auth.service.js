const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const logger = require('#utils/logger')
const authMailer = require('#modules/auth/auth.mailer')
const authRepository = require('#modules/auth/auth.repository')
const authToken = require('#modules/auth/auth.token')

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])(?=.{8,})(?!.*\s).*$/
const AUTHENTICATION_REQUIRED_MESSAGE = 'Authentication required'
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email/username or password'
const INVALID_TOKEN_MESSAGE = 'Invalid or expired token'
const PASSWORD_RESET_REQUEST_MESSAGE = 'If that email is registered, password reset instructions have been sent'
const NEW_PASSWORD_MUST_DIFFER_MESSAGE = 'New password must differ from current password'

const normalizeEmail = (email) => email.trim().toLowerCase()
const normalizeIdentifier = (identifier) => {
	const trimmedIdentifier = identifier.trim()

	return trimmedIdentifier.includes('@') ? trimmedIdentifier.toLowerCase() : trimmedIdentifier
}

const toSafeAuthUser = (user) => ({
	id: user.id,
	email: user.email,
	username: user.username,
	role: user.role,
})

const getTokenVersionFromPayload = (payload) => {
	const tokenVersion = payload?.tokenVersion

	return Number.isInteger(tokenVersion) ? tokenVersion : null
}

const getPasswordValidationMessages = (password) => {
	const details = []

	if (typeof password !== 'string' || password.length === 0) {
		details.push('Password is required')
		return details
	}

	if (password.length < PASSWORD_MIN_LENGTH) {
		details.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
	}

	if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
		details.push('Password must include uppercase, lowercase, a number, and a special character')
	}

	return details
}

const validateRegistrationInput = ({ email, username, password } = {}) => {
	const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : ''
	const normalizedUsername = typeof username === 'string' ? username.trim() : ''
	const normalizedPassword = typeof password === 'string' ? password : ''
	const details = []

	if (!normalizedEmail) {
		details.push('Email is required')
	} else if (!EMAIL_REGEX.test(normalizedEmail)) {
		details.push('Email must be valid')
	}

	if (!normalizedUsername) {
		details.push('Username is required')
	}

	details.push(...getPasswordValidationMessages(normalizedPassword))

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
	const normalizedIdentifier = typeof identifier === 'string' ? normalizeIdentifier(identifier) : ''
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

const validateChangePasswordInput = ({ currentPassword, newPassword } = {}) => {
	const normalizedCurrent = typeof currentPassword === 'string' ? currentPassword : ''
	const normalizedNew = typeof newPassword === 'string' ? newPassword : ''
	const details = []

	if (!normalizedCurrent) {
		details.push('Current password is required')
	}

	details.push(...getPasswordValidationMessages(normalizedNew))

	if (normalizedCurrent && normalizedNew && normalizedCurrent === normalizedNew) {
		details.push(NEW_PASSWORD_MUST_DIFFER_MESSAGE)
	}

	if (details.length > 0) {
		if (details.length === 1 && details[0] === NEW_PASSWORD_MUST_DIFFER_MESSAGE) {
			throw new BadRequestException(NEW_PASSWORD_MUST_DIFFER_MESSAGE)
		}

		throw new BadRequestException('Invalid request data', { details })
	}

	return {
		currentPassword: normalizedCurrent,
		newPassword: normalizedNew,
	}
}

const validateForgotPasswordInput = ({ email } = {}) => {
	const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : ''
	const details = []

	if (!normalizedEmail) {
		details.push('Email is required')
	} else if (!EMAIL_REGEX.test(normalizedEmail)) {
		details.push('Email must be valid')
	}

	if (details.length > 0) {
		throw new BadRequestException('Invalid request data', { details })
	}

	return { email: normalizedEmail }
}

const validateResetPasswordInput = ({ token, newPassword } = {}) => {
	const normalizedToken = typeof token === 'string' ? token.trim() : ''
	const normalizedNewPassword = typeof newPassword === 'string' ? newPassword : ''
	const details = []

	if (!normalizedToken) {
		details.push('Reset token is required')
	}

	details.push(...getPasswordValidationMessages(normalizedNewPassword))

	if (details.length > 0) {
		throw new BadRequestException('Invalid request data', { details })
	}

	return {
		token: normalizedToken,
		newPassword: normalizedNewPassword,
	}
}

const isUniqueConstraintError = (error) => {
	return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

const getUniqueConflictMessage = (error) => {
	const target = Array.isArray(error.meta?.target) ? error.meta.target[0] : error.meta?.target

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

	const isValidPassword = await bcrypt.compare(password, user.passwordHash)

	if (!isValidPassword) {
		throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)
	}

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
	const tokenVersion = getTokenVersionFromPayload(payload)

	if (!Number.isInteger(userId) || tokenVersion === null) {
		throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
	}

	const user = await authRepository.findTokenUserById(userId)

	if (!user || user.tokenVersion !== tokenVersion) {
		throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
	}

	return toSafeAuthUser(user)
}

const getAuthenticatedUser = async (authorizationHeader) => {
	const token = authToken.getBearerToken(authorizationHeader)

	if (!token) {
		throw new UnauthorizedException(AUTHENTICATION_REQUIRED_MESSAGE)
	}

	return await getUserFromToken(token)
}



const changePassword = async (user, payload) => {
	const { currentPassword, newPassword } = validateChangePasswordInput(payload)
	const authUser = await authRepository.findAuthById(user.id)

	if (!authUser) {
		throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
	}

	const isCurrentValid = await bcrypt.compare(currentPassword, authUser.passwordHash)

	if (!isCurrentValid) {
		throw new BadRequestException('Current password is incorrect')
	}

	const passwordHash = await bcrypt.hash(newPassword, 12)
	await authRepository.updatePasswordById(user.id, passwordHash)

	return { message: 'Password updated successfully' }
}

const requestPasswordReset = async (payload) => {
	const { email } = validateForgotPasswordInput(payload)
	const user = await authRepository.findByEmail(email)

	if (!user) {
		return {
			message: PASSWORD_RESET_REQUEST_MESSAGE,
		}
	}

	const tokenId = crypto.randomUUID()
	const tokenSecret = crypto.randomBytes(32).toString('hex')
	const tokenHash = await bcrypt.hash(tokenSecret, 12)
	const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_MS)
	const resetToken = `${tokenId}.${tokenSecret}`

	await authRepository.updatePasswordResetToken(user.id, tokenId, tokenHash, expiresAt)

	try {
		await authMailer.sendPasswordResetEmail({
			email: user.email,
			resetToken,
			expiresAt,
		})
	} catch (error) {
		try {
			await authRepository.clearPasswordResetToken(user.id)
		} catch (clearError) {
			logger.error('Failed to clear password reset token after email delivery failure', {
				userId: user.id,
				error: clearError.message,
			})
		}

		logger.error('Failed to deliver password reset email', {
			userId: user.id,
			email: user.email,
			error: error.message,
		})

		return {
			message: PASSWORD_RESET_REQUEST_MESSAGE,
		}
	}

	return {
		message: PASSWORD_RESET_REQUEST_MESSAGE,
	}
}

const resetPassword = async (payload) => {
	const { token, newPassword } = validateResetPasswordInput(payload)
	const [tokenId, tokenSecret] = token.split('.')

	if (!tokenId || !tokenSecret) {
		throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
	}

	const user = await authRepository.findByPasswordResetTokenId(tokenId)

	if (
		!user ||
		!user.passwordResetTokenExpiry ||
		new Date(user.passwordResetTokenExpiry) < new Date() ||
		!user.passwordResetTokenHash
	) {
		throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
	}

	const isValidToken = await bcrypt.compare(tokenSecret, user.passwordResetTokenHash)

	if (!isValidToken) {
		throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
	}

	const passwordHash = await bcrypt.hash(newPassword, 12)
	await authRepository.updatePasswordById(user.id, passwordHash)

	return { message: 'Password reset successful' }
}

module.exports = {
	INVALID_CREDENTIALS_MESSAGE,
	getUserFromToken,
	getAuthenticatedUser,
	register,
	login,
	toSafeAuthUser,
	changePassword,
	requestPasswordReset,
	resetPassword,
}
