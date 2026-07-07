const path = require('path')
const os = require('os')
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
})

const NODE_ENV = process.env.NODE_ENV || 'development'

const parseNumber = (key, fallback) => {
  const rawValue = process.env[key]
  const value =
    rawValue == null || rawValue === '' ? fallback : Number(rawValue)

  if (Number.isNaN(value)) {
    throw new Error(`Invalid number for env var ${key}`)
  }

  return value
}

const parseBoolean = (key, fallback) => {
  const rawValue = process.env[key]

  if (rawValue == null || rawValue === '') {
    return fallback
  }

  const normalizedValue = rawValue.trim().toLowerCase()

  if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
    return true
  }

  if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
    return false
  }

  throw new Error(`Invalid boolean for env var ${key}`)
}

const parseUrl = (key, fallback) => {
  const rawValue = process.env[key] || fallback

  try {
    return new URL(rawValue).toString().replace(/\/$/, '')
  } catch {
    throw new Error(`Invalid URL for env var ${key}`)
  }
}

const defaultClientPort =
  NODE_ENV === 'development'
    ? parseNumber('CLIENT_DEV_PORT', 5173)
    : parseNumber('CLIENT_PORT', 8080)
const defaultAppBaseUrl = `http://localhost:${defaultClientPort}`
const appBaseUrl = parseUrl('APP_BASE_URL', defaultAppBaseUrl)

const resolveTwoFactorEncryptionSecret = () => {
  if (process.env.TWO_FACTOR_ENCRYPTION_SECRET) {
    return process.env.TWO_FACTOR_ENCRYPTION_SECRET
  }

  if (NODE_ENV === 'development') {
    return process.env.JWT_SECRET
  }

  throw new Error('Missing value for env var TWO_FACTOR_ENCRYPTION_SECRET')
}

const optionalConfigs = {
  NODE_ENV,
  PORT: parseNumber('PORT', Number(process.env.SERVER_PORT) || 3001),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_LIMIT: parseNumber('RATE_LIMIT_LIMIT', 100),
  PUBLIC_RATE_LIMIT_WINDOW_MS: parseNumber(
    'PUBLIC_RATE_LIMIT_WINDOW_MS',
    60 * 1000,
  ),
  PUBLIC_RATE_LIMIT_LIMIT: parseNumber('PUBLIC_RATE_LIMIT_LIMIT', 30),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  TWO_FACTOR_CHALLENGE_EXPIRES_IN:
    process.env.TWO_FACTOR_CHALLENGE_EXPIRES_IN || '5m',
  TWO_FACTOR_ENCRYPTION_SECRET: resolveTwoFactorEncryptionSecret(),
  TWO_FACTOR_ISSUER: process.env.TWO_FACTOR_ISSUER || 'Trackscendence',
  APP_BASE_URL: appBaseUrl,
  PASSWORD_RESET_URL_BASE: parseUrl(
    'PASSWORD_RESET_URL_BASE',
    `${appBaseUrl}/reset-password`,
  ),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseNumber('SMTP_PORT', 1025),
  SMTP_SECURE: parseBoolean('SMTP_SECURE', false),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  // 42 OAuth is optional like SMTP: the /auth/42 routes answer 404 until all
  // three values are set. The redirect URI must exactly match one registered
  // on the intra application.
  FORTYTWO_CLIENT_ID: process.env.FORTYTWO_CLIENT_ID || '',
  FORTYTWO_CLIENT_SECRET: process.env.FORTYTWO_CLIENT_SECRET || '',
  FORTYTWO_REDIRECT_URI: process.env.FORTYTWO_REDIRECT_URI || '',
  FORTYTWO_STATE_EXPIRES_IN: process.env.FORTYTWO_STATE_EXPIRES_IN || '10m',
  // How long a mid-game player may stay fully disconnected (no socket at all)
  // before their game is abandoned. The game pauses for the other players and
  // shows them a countdown for this long, enough to reopen a closed tab or ride
  // out a brief network drop, then ends if the player never comes back.
  GAME_RECONNECT_GRACE_MS: parseNumber('GAME_RECONNECT_GRACE_MS', 90 * 1000),

  // How long a player has to act on their turn before the server force-draws
  // one card for them and passes, so an idle or AFK player cannot stall the
  // game. The client shows a live countdown to this deadline. Tunable.
  TURN_TIMER_MS: parseNumber('TURN_TIMER_MS', 15 * 1000),

  // Prisma connection pool (audit B4). Prisma's implicit default is
  // num_cpus*2+1; we set it explicitly so it is visible and overridable. On a
  // container os.cpus() can report host cores rather than the CPU quota, so
  // operators may pin a lower DB_CONNECTION_LIMIT. pool_timeout is in seconds.
  DB_CONNECTION_LIMIT: parseNumber(
    'DB_CONNECTION_LIMIT',
    os.cpus().length * 2 + 1,
  ),
  DB_POOL_TIMEOUT: parseNumber('DB_POOL_TIMEOUT', 10),

  // Short-TTL cache of the per-token auth lookup (audit B4), so a burst of
  // socket connects/requests for the same user skips the DB. TTL is the backstop
  // that heals a missed invalidation; MAX_ENTRIES bounds the cache. 0 disables.
  AUTH_CACHE_TTL_MS: parseNumber('AUTH_CACHE_TTL_MS', 15 * 1000),
  AUTH_CACHE_MAX_ENTRIES: parseNumber('AUTH_CACHE_MAX_ENTRIES', 10000),
}

const requiredConfigs = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
}

for (const key in requiredConfigs) {
  if (!requiredConfigs[key]) {
    throw new Error(`Missing value for env var ${key}`)
  }
}

module.exports = {
  ...optionalConfigs,
  ...requiredConfigs,
}
