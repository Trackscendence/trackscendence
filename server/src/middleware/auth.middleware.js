const ForbiddenException = require('../exceptions/forbidden.exception')
const UnauthorizedException = require('../exceptions/unauthorized.exception')

const requireAuth = (req, res, next) => {
	next(new UnauthorizedException('Authentication middleware is not implemented yet'))
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
