const { rateLimit, ipKeyGenerator } = require('express-rate-limit')
const config = require('#utils/config')
const TooManyRequestsException = require('#exceptions/too-many-requests.exception')

// Separate, stricter limiter for the public API. Requests are counted per API
// key (falling back to IP for unauthenticated requests) so one consumer cannot
// exhaust the quota of others behind the same address.
const publicRateLimiter = rateLimit({
  windowMs: config.PUBLIC_RATE_LIMIT_WINDOW_MS,
  limit: config.PUBLIC_RATE_LIMIT_LIMIT,
  legacyHeaders: false,
  keyGenerator: (req) => req.get('x-api-key') || ipKeyGenerator(req.ip),
  handler: (req, res, next) => {
    next(new TooManyRequestsException('Rate limit exceeded, try again later'))
  },
})

module.exports = publicRateLimiter
