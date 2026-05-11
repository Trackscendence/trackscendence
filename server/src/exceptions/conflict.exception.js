const AppException = require('./app.exception')

class ConflictException extends AppException {
	constructor(message = 'Conflict', payload) {
		super(409, message, payload)
		this.code = 'CONFLICT'
	}
}

module.exports = ConflictException
