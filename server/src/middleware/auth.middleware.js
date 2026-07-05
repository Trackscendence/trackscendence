const ForbiddenException = require('#exceptions/forbidden.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')

const getAuthService = () => require('#modules/auth/auth.service')

const requireAuth = async (req, res, next) => {
  try {
    req.user = await getAuthService().getAuthenticatedUser(
      req.get('authorization'),
    )
    next()
  } catch (error) {
    next(error)
  }
}

const attachUserIfPresent = async (req, res, next) => {
  const authorization = req.get('authorization')

  if (!authorization) {
    next()
    return
  }

  try {
    req.user = await getAuthService().getAuthenticatedUser(authorization)
    next()
  } catch (error) {
    next(error)
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenException('Insufficient permissions'))
    }

    next()
  }
}

module.exports = {
  attachUserIfPresent,
  requireAuth,
  requireRole,
}
