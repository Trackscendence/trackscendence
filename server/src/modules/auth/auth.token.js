const jwt = require('jsonwebtoken')
const config = require('#utils/config')

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

const verifyAccessToken = (token) => {
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
  verifyAccessToken,
}
