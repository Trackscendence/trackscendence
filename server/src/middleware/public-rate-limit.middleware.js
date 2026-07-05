const { rateLimit, ipKeyGenerator } = require('express-rate-limit')
const config = require('#utils/config')
const TooManyRequestsException = require('#exceptions/too-many-requests.exception')

// Separate, stricter limiter for the public API. It is mounted after
// requireApiKey, so requests are counted per authenticated key owner: one
// consumer cannot exhaust the quota of others behind the same address, and
// rotating keys (valid or invalid) cannot mint extra quota.
const publicRateLimiter = rateLimit({
  windowMs: config.PUBLIC_RATE_LIMIT_WINDOW_MS,
  limit: config.PUBLIC_RATE_LIMIT_LIMIT,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  handler: (req, res, next) => {
    next(new TooManyRequestsException('Rate limit exceeded, try again later'))
  },
})

module.exports = publicRateLimiter
