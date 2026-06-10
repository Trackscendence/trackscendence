const jwt = require('jsonwebtoken')
const config = require('#utils/config')

const TWO_FACTOR_CHALLENGE_PURPOSE = 'login-2fa'

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

const signTwoFactorChallengeToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      tokenVersion: user.tokenVersion,
      purpose: TWO_FACTOR_CHALLENGE_PURPOSE,
    },
    config.JWT_SECRET,
    { expiresIn: config.TWO_FACTOR_CHALLENGE_EXPIRES_IN },
  )
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
  signTwoFactorChallengeToken,
  verifyAccessToken,
  verifyTwoFactorChallengeToken,
  TWO_FACTOR_CHALLENGE_PURPOSE,
}
