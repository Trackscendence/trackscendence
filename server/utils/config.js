const path = require('path')
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

const optionalConfigs = {
  NODE_ENV,
  PORT: parseNumber('PORT', Number(process.env.SERVER_PORT) || 3001),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_LIMIT: parseNumber('RATE_LIMIT_LIMIT', 100),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
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
