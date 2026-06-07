const winston = require('winston')
const config = require('#utils/config')

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const extra = Object.keys(metadata).length
      ? ` ${JSON.stringify(metadata)}`
      : ''
    return `${timestamp} ${level}: ${message}${extra}`
  }),
)

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format:
    config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
  silent: config.NODE_ENV === 'test',
})

module.exports = logger
