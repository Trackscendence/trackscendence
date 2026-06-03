const AppException = require('#exceptions/app.exception')

class BadRequestException extends AppException {
  constructor(message = 'Bad request', payload) {
    super(400, message, payload)
    this.code = 'BAD_REQUEST'
  }
}

module.exports = BadRequestException
