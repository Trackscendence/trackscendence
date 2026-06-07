const AppException = require('#exceptions/app.exception')

class ForbiddenException extends AppException {
  constructor(message = 'Forbidden', payload) {
    super(403, message, payload)
    this.code = 'FORBIDDEN'
  }
}

module.exports = ForbiddenException
