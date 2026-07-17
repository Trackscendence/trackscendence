const morgan = require('morgan')
const config = require('#utils/config')
const logger = require('#utils/logger')

const format =
  config.NODE_ENV === 'development'
    ? ':method :url :status :response-time ms - :res[content-length] req_id=:request-id'
    : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" req_id=:request-id'

morgan.token('request-id', (req) => req.requestId || '-')

module.exports = morgan(format, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
})
