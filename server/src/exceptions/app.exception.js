class AppException extends Error {
	constructor(statusCode = 500, message = 'Something went wrong', payload) {
		super(message)
		this.name = this.constructor.name
		this.statusCode = statusCode
		this.code = this.constructor.name
		this.payload = payload
		Error.captureStackTrace(this, this.constructor)
	}
}

module.exports = AppException
