const { rateLimit } = require('express-rate-limit')
const config = require('../../utils/config')

const rateLimiter = rateLimit({
	windowMs: config.RATE_LIMIT_WINDOW_MS,
	limit: config.RATE_LIMIT_LIMIT,
	legacyHeaders: false,
	skip: () => config.NODE_ENV !== 'production',
})

module.exports = rateLimiter
