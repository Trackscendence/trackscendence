const requireApiKey = async (req, res, next) => {
  try {
    const apiKeysService = require('#modules/api-keys/api-keys.service')
    req.user = await apiKeysService.getUserForApiKey(req.get('x-api-key'))
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  requireApiKey,
}
