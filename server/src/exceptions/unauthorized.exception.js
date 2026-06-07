const AppException = require('#exceptions/app.exception')

class UnauthorizedException extends AppException {
  constructor(message = 'Unauthorized', payload) {
    super(401, message, payload)
    this.code = 'UNAUTHORIZED'
  }
}

module.exports = UnauthorizedException
