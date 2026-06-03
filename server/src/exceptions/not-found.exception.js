const AppException = require('#exceptions/app.exception')

class NotFoundException extends AppException {
  constructor(message = 'Not found', payload) {
    super(404, message, payload)
    this.code = 'NOT_FOUND'
  }
}

module.exports = NotFoundException
