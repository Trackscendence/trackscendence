const AppException = require('#exceptions/app.exception')

class TooManyRequestsException extends AppException {
  constructor(message = 'Too many requests', payload) {
    super(429, message, payload)
    this.code = 'TOO_MANY_REQUESTS'
  }
}

module.exports = TooManyRequestsException
