const ForbiddenException = require('#exceptions/forbidden.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')

const requireAuth = async (req, res, next) => {
  try {
    const authService = require('#modules/auth/auth.service')
    req.user = await authService.getAuthenticatedUser(req.get('authorization'))
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
  requireAuth,
  requireRole,
}
