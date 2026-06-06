const BadRequestException = require('#exceptions/bad-request.exception')

const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (result.error) {
      const details = result.error.details.map((detail) => detail.message)
      return next(new BadRequestException('Invalid request data', { details }))
    }

    req[source] = result.value
    next()
  }
}

module.exports = {
  validateRequest,
}
