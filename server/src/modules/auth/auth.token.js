const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const config = require('#utils/config')

const TWO_FACTOR_CHALLENGE_PURPOSE = 'login-2fa'
const OAUTH_STATE_PURPOSE = 'oauth-42-state'

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null
  }

  const parts = authorizationHeader.split(' ')
  const [scheme, token] = parts

  if (parts.length !== 2 || scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN },
  )
}

const signTwoFactorChallengeToken = (user, challengeVersion) => {
  return jwt.sign(
    {
      sub: user.id,
      tokenVersion: user.tokenVersion,
      purpose: TWO_FACTOR_CHALLENGE_PURPOSE,
      challengeVersion,
    },
    config.JWT_SECRET,
    { expiresIn: config.TWO_FACTOR_CHALLENGE_EXPIRES_IN },
  )
}

// The OAuth state is a signed, single-purpose, expiring token instead of a
// session-bound nonce because the API is stateless: there is no server-side
// session to store a nonce in, and the callback is completed by our own
// client posting the code back rather than by a cookie round-trip.
const signOAuthStateToken = () => {
  return jwt.sign(
    {
      purpose: OAUTH_STATE_PURPOSE,
      jti: crypto.randomUUID(),
    },
    config.JWT_SECRET,
    { expiresIn: config.FORTYTWO_STATE_EXPIRES_IN },
  )
}

const verifyOAuthStateToken = (token) => {
  const payload = jwt.verify(token, config.JWT_SECRET)

  if (payload.purpose !== OAUTH_STATE_PURPOSE) {
    throw new jwt.JsonWebTokenError('invalid oauth state purpose')
  }

  return payload
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET)
}

const verifyTwoFactorChallengeToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET)
}

const isTokenError = (error) => {
  return (
    error instanceof jwt.JsonWebTokenError ||
    error instanceof jwt.TokenExpiredError
  )
}

module.exports = {
  getBearerToken,
  isTokenError,
  signAccessToken,
  signOAuthStateToken,
  signTwoFactorChallengeToken,
  verifyAccessToken,
  verifyOAuthStateToken,
  verifyTwoFactorChallengeToken,
  OAUTH_STATE_PURPOSE,
  TWO_FACTOR_CHALLENGE_PURPOSE,
}
