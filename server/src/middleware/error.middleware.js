const config = require('../../utils/config')
const logger = require('../../utils/logger')
const NotFoundException = require('../exceptions/not-found.exception')

const notFound = (req, res, next) => {
	next(new NotFoundException(`Route ${req.method} ${req.originalUrl} not found`))
}

const errorHandler = (err, req, res, next) => {
	const statusCode = err.statusCode || err.status || 500
	const isServerError = statusCode >= 500
	const message =
		isServerError && config.NODE_ENV === 'production'
			? 'Something went wrong'
			: err.message || 'Something went wrong'

	if (isServerError) {
		logger.error(err.stack || err.message)
	}

	res.status(statusCode).json({
		error: {
			code: err.code || (isServerError ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
			message,
			...(err.payload ? { payload: err.payload } : {}),
			...(config.NODE_ENV === 'development' && isServerError && err.stack
				? { stack: err.stack }
				: {}),
		},
	})
}

module.exports = {
	notFound,
	errorHandler,
}
