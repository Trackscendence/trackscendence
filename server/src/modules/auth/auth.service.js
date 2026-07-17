const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { Prisma } = require('@prisma/client')
const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const ForbiddenException = require('#exceptions/forbidden.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const logger = require('#utils/logger')
const authFortyTwo = require('#modules/auth/auth.forty-two')
const authMailer = require('#modules/auth/auth.mailer')
const authRepository = require('#modules/auth/auth.repository')
const authToken = require('#modules/auth/auth.token')
const authTokenCache = require('#modules/auth/auth.token-cache')
const authTwoFactor = require('#modules/auth/auth.two-factor')
const { isAdminEmail, ROLES } = require('#modules/auth/auth.roles')
const {
  normalizeIdentifier,
  normalizeEmail,
  normalizeRegistrationInput,
} = require('#modules/auth/auth.normalizations')
const {
  EMAIL_MAX_LENGTH,
  USERNAME_REGEX,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_WHITESPACE_REGEX,
  PASSWORD_UPPERCASE_REGEX,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_NUMBER_REGEX,
  PASSWORD_SYMBOL_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_TOKEN_EXPIRES_MS,
  EMAIL_REGEX,
  AUTHENTICATION_REQUIRED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_TOKEN_MESSAGE,
  INVALID_TWO_FACTOR_CODE_MESSAGE,
  PASSWORD_RESET_REQUEST_MESSAGE,
  TWO_FACTOR_REQUIRED_MESSAGE,
  TWO_FACTOR_ALREADY_ENABLED_MESSAGE,
  TWO_FACTOR_NOT_ENABLED_MESSAGE,
  TWO_FACTOR_SETUP_NOT_STARTED_MESSAGE,
  TWO_FACTOR_SETUP_INVALID_MESSAGE,
  NEW_PASSWORD_MUST_DIFFER_MESSAGE,
  PASSWORD_LOGIN_NOT_ENABLED_MESSAGE,
  MAX_LOGIN_ATTEMPTS,
  LOCKED_DURATION_MINUTES,
  GENERIC_ACCOUNT_LOCKED_MESSAGE,
  ACCOUNT_SUSPENDED_MESSAGE,
  ACCOUNT_BANNED_MESSAGE,
  FORTYTWO_LOGIN_FAILED_MESSAGE,
  FORTYTWO_NOT_AVAILABLE_MESSAGE,
} = require('#modules/auth/auth.constants')

const toSafeAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  gamesPlayed: user.gamesPlayed,
  wins: user.wins,
  losses: user.losses,
  rank: user.rank,
  isGuest: Boolean(user.isGuest),
  role: user.role,
  createdAt: user.createdAt,
  termsAcceptedAt: user.termsAcceptedAt,
  privacyAcceptedAt: user.privacyAcceptedAt,
  twoFactorEnabled: Boolean(user.twoFactorEnabled),
  twoFactorSetupPending: Boolean(user.twoFactorPendingSecretCiphertext),
})

const getTokenVersionFromPayload = (payload) => {
  const tokenVersion = payload?.tokenVersion

  return Number.isInteger(tokenVersion) ? tokenVersion : null
}

const isSuspensionActive = (user, now = new Date()) => {
  if (user.status !== 'SUSPENDED') {
    return false
  }

  if (!user.suspendedUntil) {
    return true
  }

  return new Date(user.suspendedUntil) > now
}

const assertUserCanAuthenticate = (user) => {
  if (user.status === 'BANNED') {
    throw new ForbiddenException(ACCOUNT_BANNED_MESSAGE)
  }

  if (isSuspensionActive(user)) {
    throw new ForbiddenException(ACCOUNT_SUSPENDED_MESSAGE)
  }
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

  if (password.length > PASSWORD_MAX_LENGTH) {
    details.push(`Password must be less than ${PASSWORD_MAX_LENGTH} characters`)
  }

  if (PASSWORD_WHITESPACE_REGEX.test(password)) {
    details.push('Password must not contain whitespace')
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    details.push('Password must contain an uppercase letter')
  }

  if (!PASSWORD_LOWERCASE_REGEX.test(password)) {
    details.push('Password must contain a lowercase letter')
  }

  if (!PASSWORD_NUMBER_REGEX.test(password)) {
    details.push('Password must contain a number')
  }

  if (!PASSWORD_SYMBOL_REGEX.test(password)) {
    details.push('Password must contain a symbol')
  }

  return details
}

// BACKEND VALIDATIONS FOR SIGNUP PAGE
const validateRegistrationInput = ({
  email,
  username,
  password,
  privacyAccepted,
  termsAccepted,
} = {}) => {
  const details = []

  if (!email) {
    details.push('Email address is required')
  } else if (!EMAIL_REGEX.test(email)) {
    details.push('Email must be valid')
  } else if (email.length > EMAIL_MAX_LENGTH) {
    details.push(`Email must not be more than ${EMAIL_MAX_LENGTH} characters`)
  }

  if (!username) {
    details.push('Username is required')
  } else if (!USERNAME_REGEX.test(username)) {
    details.push(
      'Username must start with a letter and contain only lowercase letters and numbers',
    )
  } else if (username.length < USERNAME_MIN_LENGTH) {
    details.push(
      `Username must not be less than ${USERNAME_MIN_LENGTH} characters`,
    )
  } else if (username.length > USERNAME_MAX_LENGTH) {
    details.push(
      `Username must not be more than ${USERNAME_MAX_LENGTH} characters`,
    )
  }

  details.push(...getPasswordValidationMessages(password))

  if (!termsAccepted) {
    details.push('Terms of Service acceptance is required')
  }

  if (!privacyAccepted) {
    details.push('Privacy Policy acceptance is required')
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }
}

// BACKEND VALIDATIONS FOR LOGIN PAGE
const validateLoginInput = ({ identifier, password } = {}) => {
  const normalizedIdentifier =
    typeof identifier === 'string' ? normalizeIdentifier(identifier) : ''
  const normalizedPassword = typeof password === 'string' ? password : ''
  const details = []

  if (!normalizedIdentifier) {
    details.push('Email or username is required')
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

const validateTwoFactorLoginInput = ({
  challengeToken,
  code,
  recoveryCode,
} = {}) => {
  const normalizedChallengeToken =
    typeof challengeToken === 'string' ? challengeToken.trim() : ''
  const normalizedCode = authTwoFactor.normalizeTotpCode(code)
  const normalizedRecoveryCode =
    authTwoFactor.normalizeRecoveryCode(recoveryCode)
  const details = []

  if (!normalizedChallengeToken) {
    details.push('Challenge token is required')
  }

  if (!normalizedCode && !normalizedRecoveryCode) {
    details.push('Either a two-factor code or a recovery code is required')
  }

  if (normalizedCode && normalizedRecoveryCode) {
    details.push('Use either a two-factor code or a recovery code, not both')
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return {
    challengeToken: normalizedChallengeToken,
    code: normalizedCode,
    recoveryCode: normalizedRecoveryCode,
  }
}

const validateTwoFactorConfirmationInput = ({ code } = {}) => {
  const normalizedCode = authTwoFactor.normalizeTotpCode(code)

  if (!normalizedCode) {
    throw new BadRequestException('Invalid request data', {
      details: ['Two-factor code is required'],
    })
  }

  return {
    code: normalizedCode,
  }
}

const validateChangePasswordInput = ({ currentPassword, newPassword } = {}) => {
  const normalizedCurrent =
    typeof currentPassword === 'string' ? currentPassword : ''
  const normalizedNew = typeof newPassword === 'string' ? newPassword : ''
  const details = []

  if (!normalizedCurrent) {
    details.push('Current password is required')
  }

  details.push(...getPasswordValidationMessages(normalizedNew))

  if (
    normalizedCurrent &&
    normalizedNew &&
    normalizedCurrent === normalizedNew
  ) {
    details.push(NEW_PASSWORD_MUST_DIFFER_MESSAGE)
  }

  if (details.length > 0) {
    if (
      details.length === 1 &&
      details[0] === NEW_PASSWORD_MUST_DIFFER_MESSAGE
    ) {
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
  const normalizedNewPassword =
    typeof newPassword === 'string' ? newPassword : ''
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

const buildTwoFactorSetupResponse = async ({
  accountName,
  secret,
  recoveryCodes,
}) => {
  const otpauthUrl = authTwoFactor.buildOtpauthUrl({
    accountName,
    secret,
  })

  return {
    manualEntryKey: secret,
    otpauthUrl,
    qrCodeDataUrl: await authTwoFactor.buildQrCodeDataUrl(otpauthUrl),
    recoveryCodes,
  }
}

const createPendingTwoFactorSetup = async (
  user,
  { allowEnabled = false } = {},
) => {
  if (!allowEnabled && user.twoFactorEnabled) {
    throw new ConflictException(TWO_FACTOR_ALREADY_ENABLED_MESSAGE)
  }

  const secret = authTwoFactor.generateSecret()
  const encryptedSecret = authTwoFactor.encryptSecret(secret)
  const recoveryCodes = authTwoFactor.generateRecoveryCodes()
  const recoveryCodeHashes = recoveryCodes.map((code) =>
    authTwoFactor.hashRecoveryCode(code),
  )

  await authRepository.replacePendingTwoFactorSetup(
    user.id,
    encryptedSecret,
    recoveryCodeHashes,
  )

  return await buildTwoFactorSetupResponse({
    accountName: user.email,
    secret,
    recoveryCodes,
  })
}

const getTwoFactorChallengePayload = (challengeToken) => {
  let payload

  try {
    payload = authToken.verifyTwoFactorChallengeToken(challengeToken)
  } catch (error) {
    if (authToken.isTokenError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }

  const userId = Number(payload.sub)
  const tokenVersion = getTokenVersionFromPayload(payload)
  const challengeVersion = Number(payload.challengeVersion)

  if (
    !Number.isInteger(userId) ||
    tokenVersion === null ||
    !Number.isInteger(challengeVersion) ||
    payload.purpose !== authToken.TWO_FACTOR_CHALLENGE_PURPOSE
  ) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  return {
    challengeVersion,
    userId,
    tokenVersion,
  }
}

const validateFortyTwoCallbackInput = ({ code, state } = {}) => {
  const normalizedCode = typeof code === 'string' ? code.trim() : ''
  const normalizedState = typeof state === 'string' ? state.trim() : ''
  const details = []

  if (!normalizedCode) {
    details.push('Authorization code is required')
  }

  if (!normalizedState) {
    details.push('State is required')
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return {
    code: normalizedCode,
    state: normalizedState,
  }
}

// Intra logins may be shorter than our signup minimum or contain characters
// the signup regex rejects (hyphens). Profile lookups deliberately accept any
// non-empty username, so a sanitized short login is safe everywhere except
// the signup form, which OAuth users never touch.
const sanitizeFortyTwoLogin = (login) => {
  const normalized =
    typeof login === 'string'
      ? login
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .replace(/^[0-9]+/, '')
      : ''

  // Leave room for a collision suffix within the username length cap.
  return (normalized || 'player').slice(0, USERNAME_MAX_LENGTH - 4)
}

const resolveAvailableUsername = async (base, isTaken) => {
  if (!(await isTaken(base))) {
    return base
  }

  for (let suffix = 2; suffix <= 9999; suffix += 1) {
    const candidate = `${base}${suffix}`

    if (!(await isTaken(candidate))) {
      return candidate
    }
  }

  throw new ConflictException('Username is already taken')
}

const GUEST_EMAIL_DOMAIN = 'guest.trackscendence.invalid'
const GUEST_IDENTITY_RETRIES = 5

const buildGuestIdentity = () => {
  const usernameSuffix = crypto.randomBytes(6).toString('hex')
  const label = usernameSuffix.slice(0, 4).toUpperCase()

  return {
    email: `guest-${crypto.randomUUID()}@${GUEST_EMAIL_DOMAIN}`,
    username: `guest${usernameSuffix}`,
    displayName: `Guest ${label}`,
  }
}

const createGuestUser = async () => {
  for (let attempt = 0; attempt < GUEST_IDENTITY_RETRIES; attempt += 1) {
    try {
      return await authRepository.createGuestUser(buildGuestIdentity())
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
    }
  }

  throw new ConflictException('Guest login is unavailable. Please try again')
}

const buildFortyTwoProfile = (rawProfile) => {
  const fortyTwoId = Number(rawProfile?.id)
  const email =
    typeof rawProfile?.email === 'string'
      ? normalizeEmail(rawProfile.email)
      : ''
  const login = typeof rawProfile?.login === 'string' ? rawProfile.login : ''

  if (!Number.isInteger(fortyTwoId) || fortyTwoId <= 0 || !email || !login) {
    throw new UnauthorizedException(FORTYTWO_LOGIN_FAILED_MESSAGE)
  }

  const displayName =
    typeof rawProfile?.displayname === 'string' && rawProfile.displayname.trim()
      ? rawProfile.displayname.trim()
      : null
  const avatarUrl =
    typeof rawProfile?.image?.versions?.medium === 'string'
      ? rawProfile.image.versions.medium
      : typeof rawProfile?.image?.link === 'string'
        ? rawProfile.image.link
        : null

  return { fortyTwoId, email, login, displayName, avatarUrl }
}

const ensureFortyTwoConfigured = () => {
  if (!authFortyTwo.isConfigured()) {
    throw new NotFoundException(FORTYTWO_NOT_AVAILABLE_MESSAGE)
  }
}

const buildLoginResult = async (user) => {
  if (user.twoFactorEnabled) {
    const challenge = await authRepository.issueTwoFactorChallenge(user.id)

    return {
      requiresTwoFactor: true,
      message: TWO_FACTOR_REQUIRED_MESSAGE,
      challengeToken: authToken.signTwoFactorChallengeToken(
        challenge,
        challenge.twoFactorChallengeVersion,
      ),
      methods: ['totp', 'recovery_code'],
    }
  }

  return {
    token: authToken.signAccessToken(user),
    user: toSafeAuthUser(user),
  }
}

const getFortyTwoAuthorizeUrl = () => {
  ensureFortyTwoConfigured()

  return authFortyTwo.buildAuthorizeUrl(authToken.signOAuthStateToken())
}

// The client asks this instead of carrying its own build-time flag, so the
// server env is the single source of truth for provider availability.
const getAuthProviders = () => ({
  fortyTwo: authFortyTwo.isConfigured(),
})

const provisionFortyTwoUser = async (profile) => {
  const existingByEmail = await authRepository.findByEmail(profile.email)

  // 42 verifies member emails, and a linked account with 2FA enabled still
  // goes through the 2FA challenge, so auto-linking is safe here.
  if (existingByEmail) {
    assertUserCanAuthenticate(existingByEmail)

    return await authRepository.linkFortyTwoId(
      existingByEmail.id,
      profile.fortyTwoId,
    )
  }

  const username = await resolveAvailableUsername(
    sanitizeFortyTwoLogin(profile.login),
    async (candidate) =>
      Boolean(await authRepository.findByUsername(candidate)),
  )

  try {
    return await authRepository.createFortyTwoUser({
      email: profile.email,
      username,
      fortyTwoId: profile.fortyTwoId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      role: isAdminEmail(profile.email) ? ROLES.ADMIN : ROLES.USER,
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(getUniqueConflictMessage(error))
    }

    throw error
  }
}

const reconcileAllowlistedAdmin = async (user, email) => {
  if (!isAdminEmail(email) || user.role === ROLES.ADMIN) {
    return user
  }

  const promotedUser = await authRepository.promoteAllowlistedAdmin(user.id)
  authTokenCache.invalidate(user.id)
  return promotedUser
}

const loginWithFortyTwo = async (payload) => {
  ensureFortyTwoConfigured()

  const { code, state } = validateFortyTwoCallbackInput(payload)

  try {
    authToken.verifyOAuthStateToken(state)
  } catch (error) {
    if (authToken.isTokenError(error)) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }

    throw error
  }

  const accessToken = await authFortyTwo.exchangeCodeForAccessToken(code)

  if (!accessToken) {
    throw new UnauthorizedException(FORTYTWO_LOGIN_FAILED_MESSAGE)
  }

  const rawProfile = await authFortyTwo.fetchProfile(accessToken)

  if (!rawProfile) {
    throw new UnauthorizedException(FORTYTWO_LOGIN_FAILED_MESSAGE)
  }

  const profile = buildFortyTwoProfile(rawProfile)
  const provisionedUser =
    (await authRepository.findByFortyTwoId(profile.fortyTwoId)) ||
    (await provisionFortyTwoUser(profile))
  const user = await reconcileAllowlistedAdmin(provisionedUser, profile.email)

  assertUserCanAuthenticate(user)
  return await buildLoginResult(user)
}

const register = async (payload) => {
  const normalizedPayload = normalizeRegistrationInput(payload)

  validateRegistrationInput(normalizedPayload)

  const { email, username, password } = normalizedPayload
  const acceptedAt = new Date()

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
      privacyAcceptedAt: acceptedAt,
      termsAcceptedAt: acceptedAt,
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

  if (user.isBot) {
    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)
  }

  assertUserCanAuthenticate(user)

  if (user.lockedOutUntil && new Date(user.lockedOutUntil) > new Date()) {
    throw new UnauthorizedException(GENERIC_ACCOUNT_LOCKED_MESSAGE)
  }

  // 42-provisioned accounts have no password hash until a reset sets one.
  if (!user.passwordHash) {
    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)

  if (!isValidPassword) {
    const attempts = user.failedLoginCount + 1

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await authRepository.updateUserLoginAttempts(user.id, {
        failedLoginCount: 0,
        lockedOutUntil: new Date(
          Date.now() + LOCKED_DURATION_MINUTES * 60 * 1000,
        ),
      })
    } else {
      await authRepository.updateUserLoginAttempts(user.id, {
        failedLoginCount: attempts,
      })
    }

    throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)
  }

  await authRepository.updateUserLoginAttempts(user.id, {
    failedLoginCount: 0,
    lockedOutUntil: null,
  })

  return await buildLoginResult(user)
}

const loginAsGuest = async () => {
  return await buildLoginResult(await createGuestUser())
}

const upgradeGuestAccount = async (viewer, payload) => {
  const authUser = await authRepository.findAuthById(viewer.id)

  if (!authUser) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  if (!authUser.isGuest) {
    throw new BadRequestException('Only guest accounts can be upgraded')
  }

  const normalizedPayload = normalizeRegistrationInput(payload)
  validateRegistrationInput(normalizedPayload)

  const { email, username, password } = normalizedPayload
  const [existingEmail, existingUsername] = await Promise.all([
    authRepository.findByEmail(email),
    authRepository.findByUsername(username),
  ])

  if (existingEmail && existingEmail.id !== authUser.id) {
    throw new ConflictException('Email is already registered')
  }

  if (existingUsername && existingUsername.id !== authUser.id) {
    throw new ConflictException('Username is already taken')
  }

  const acceptedAt = new Date()
  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const upgradedUser = await authRepository.upgradeGuestById(authUser.id, {
      email,
      username,
      passwordHash,
      privacyAcceptedAt: acceptedAt,
      termsAcceptedAt: acceptedAt,
    })

    if (!upgradedUser) {
      throw new BadRequestException('Only guest accounts can be upgraded')
    }

    // The upgrade bumped tokenVersion, so any cached auth for the old token
    // must go (audit B4).
    authTokenCache.invalidate(authUser.id)
    return await buildLoginResult(upgradedUser)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(getUniqueConflictMessage(error))
    }

    throw error
  }
}

const completeTwoFactorLogin = async (payload) => {
  const { challengeToken, code, recoveryCode } =
    validateTwoFactorLoginInput(payload)
  const challenge = getTwoFactorChallengePayload(challengeToken)
  const user = await authRepository.findAuthById(challenge.userId)

  if (
    !user ||
    !user.twoFactorEnabled ||
    !user.twoFactorSecretCiphertext ||
    user.tokenVersion !== challenge.tokenVersion
  ) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  assertUserCanAuthenticate(user)

  if (recoveryCode) {
    const consumed = await authRepository.consumeRecoveryCodeAndChallenge(
      user.id,
      authTwoFactor.hashRecoveryCode(recoveryCode),
      challenge.challengeVersion,
    )

    if (!consumed) {
      throw new UnauthorizedException(INVALID_TWO_FACTOR_CODE_MESSAGE)
    }
  } else {
    let secret

    try {
      secret = authTwoFactor.decryptSecret(user.twoFactorSecretCiphertext)
    } catch (error) {
      logger.warn('Failed to decrypt stored two-factor secret during login', {
        userId: user.id,
        error: error.message,
      })

      throw new UnauthorizedException(INVALID_TWO_FACTOR_CODE_MESSAGE)
    }

    if (!authTwoFactor.verifyTotpCode(secret, code)) {
      throw new UnauthorizedException(INVALID_TWO_FACTOR_CODE_MESSAGE)
    }

    const consumed = await authRepository.consumeTwoFactorChallenge(
      user.id,
      challenge.challengeVersion,
    )

    if (!consumed) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
    }
  }

  return {
    token: authToken.signAccessToken(user),
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

  if (
    !Number.isInteger(userId) ||
    tokenVersion === null ||
    payload.purpose !== undefined
  ) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  // Fast path (audit B4): a cache hit still re-checks the token's version
  // against the version we cached from the DB, so a revoked token is rejected;
  // only a matching, unexpired entry skips the DB read.
  const cached = authTokenCache.get(userId)
  if (cached && cached.tokenVersion === tokenVersion) {
    return cached.user
  }

  const user = await authRepository.findTokenUserById(userId)

  if (!user || user.deletedAt || user.tokenVersion !== tokenVersion) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  assertUserCanAuthenticate(user)

  const safeUser = toSafeAuthUser(user)
  authTokenCache.set(userId, user.tokenVersion, safeUser)
  return safeUser
}

const getAuthenticatedUser = async (authorizationHeader) => {
  const token = authToken.getBearerToken(authorizationHeader)

  if (!token) {
    throw new UnauthorizedException(AUTHENTICATION_REQUIRED_MESSAGE)
  }

  return await getUserFromToken(token)
}

const setupTwoFactor = async (user) => {
  const authUser = await authRepository.findAuthById(user.id)

  if (!authUser) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  return {
    setup: await createPendingTwoFactorSetup(authUser),
    message: 'Two-factor authentication setup started',
  }
}

const regenerateTwoFactor = async (user) => {
  const authUser = await authRepository.findAuthById(user.id)

  if (!authUser) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  return {
    setup: await createPendingTwoFactorSetup(authUser, {
      allowEnabled: true,
    }),
    message: authUser.twoFactorEnabled
      ? 'Two-factor authentication reset started'
      : 'Two-factor authentication setup restarted',
  }
}

const confirmTwoFactorSetup = async (user, payload) => {
  const { code } = validateTwoFactorConfirmationInput(payload)
  const authUser = await authRepository.findAuthById(user.id)

  if (!authUser) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  if (!authUser.twoFactorPendingSecretCiphertext) {
    throw new BadRequestException(TWO_FACTOR_SETUP_NOT_STARTED_MESSAGE)
  }

  let pendingSecret

  try {
    pendingSecret = authTwoFactor.decryptSecret(
      authUser.twoFactorPendingSecretCiphertext,
    )
  } catch (error) {
    logger.warn('Failed to decrypt pending two-factor setup secret', {
      userId: user.id,
      error: error.message,
    })

    throw new BadRequestException(TWO_FACTOR_SETUP_INVALID_MESSAGE)
  }

  if (!authTwoFactor.verifyTotpCode(pendingSecret, code)) {
    throw new BadRequestException(INVALID_TWO_FACTOR_CODE_MESSAGE)
  }

  await authRepository.activatePendingTwoFactorSetup(
    user.id,
    authUser.twoFactorPendingSecretCiphertext,
  )

  return {
    message: authUser.twoFactorEnabled
      ? 'Two-factor authentication updated successfully'
      : 'Two-factor authentication enabled successfully',
  }
}

const disableTwoFactor = async (user) => {
  const authUser = await authRepository.findAuthById(user.id)

  if (!authUser) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  if (
    !authUser.twoFactorEnabled &&
    !authUser.twoFactorSecretCiphertext &&
    !authUser.twoFactorPendingSecretCiphertext
  ) {
    throw new BadRequestException(TWO_FACTOR_NOT_ENABLED_MESSAGE)
  }

  await authRepository.clearTwoFactorById(user.id)

  return { message: 'Two-factor authentication disabled successfully' }
}

const changePassword = async (user, payload) => {
  const { currentPassword, newPassword } = validateChangePasswordInput(payload)
  const authUser = await authRepository.findAuthById(user.id)

  if (!authUser) {
    throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
  }

  if (!authUser.passwordHash) {
    throw new BadRequestException(PASSWORD_LOGIN_NOT_ENABLED_MESSAGE)
  }

  const isCurrentValid = await bcrypt.compare(
    currentPassword,
    authUser.passwordHash,
  )

  if (!isCurrentValid) {
    throw new BadRequestException('Current password is incorrect')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await authRepository.updatePasswordById(user.id, passwordHash)
  // The password change bumped tokenVersion, invalidating every old token
  // (audit B4): drop the cached entry so the fast path can't keep one alive.
  authTokenCache.invalidate(user.id)

  return { message: 'Password updated successfully' }
}

const requestPasswordReset = async (payload) => {
  const { email } = validateForgotPasswordInput(payload)
  const user = await authRepository.findByEmail(email)

  if (!user || user.isBot) {
    return {
      message: PASSWORD_RESET_REQUEST_MESSAGE,
    }
  }

  const tokenId = crypto.randomUUID()
  const tokenSecret = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(tokenSecret, 12)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_MS)
  const resetToken = `${tokenId}.${tokenSecret}`

  await authRepository.updatePasswordResetToken(
    user.id,
    tokenId,
    tokenHash,
    expiresAt,
  )

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
      logger.error(
        'Failed to clear password reset token after email delivery failure',
        {
          userId: user.id,
          error: clearError.message,
        },
      )
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

  await authRepository.withLockedPasswordResetToken(
    tokenId,
    async (user, tx) => {
      if (
        !user ||
        !user.passwordResetTokenExpiry ||
        new Date(user.passwordResetTokenExpiry) < new Date() ||
        !user.passwordResetTokenHash ||
        user.isBot
      ) {
        throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
      }

      const isValidToken = await bcrypt.compare(
        tokenSecret,
        user.passwordResetTokenHash,
      )

      if (!isValidToken) {
        throw new UnauthorizedException(INVALID_TOKEN_MESSAGE)
      }

      // A null hash means a 42-provisioned account setting its first
      // password, so there is no current password to differ from.
      const isSameAsCurrentPassword = user.passwordHash
        ? await bcrypt.compare(newPassword, user.passwordHash)
        : false

      if (isSameAsCurrentPassword) {
        throw new BadRequestException(NEW_PASSWORD_MUST_DIFFER_MESSAGE)
      }

      const passwordHash = await bcrypt.hash(newPassword, 12)
      await authRepository.updatePasswordByIdInTransaction(
        tx,
        user.id,
        passwordHash,
      )
      // The reset bumped tokenVersion, revoking every old token (audit B4).
      // A rollback after this only costs a cache miss, so it is safe here.
      authTokenCache.invalidate(user.id)
    },
  )

  return { message: 'Password reset successful' }
}

module.exports = {
  changePassword,
  completeTwoFactorLogin,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getAuthenticatedUser,
  getAuthProviders,
  getFortyTwoAuthorizeUrl,
  getUserFromToken,
  login,
  loginAsGuest,
  loginWithFortyTwo,
  regenerateTwoFactor,
  register,
  requestPasswordReset,
  resetPassword,
  setupTwoFactor,
  upgradeGuestAccount,
  // Test seams: internal helpers with no production consumers outside this
  // file, exported only so auth.service.test.js can unit-test them directly.
  buildFortyTwoProfile,
  buildGuestIdentity,
  provisionFortyTwoUser,
  reconcileAllowlistedAdmin,
  resolveAvailableUsername,
  sanitizeFortyTwoLogin,
  validateFortyTwoCallbackInput,
  validateLoginInput,
  validateRegistrationInput,
}
