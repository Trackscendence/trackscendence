const apiKeysService = require('#modules/api-keys/api-keys.service')

const createApiKey = async (req, res) => {
  const result = await apiKeysService.createApiKey(req.user, req.body)

  res.status(201).json(result)
}

const listApiKeys = async (req, res) => {
  const result = await apiKeysService.listApiKeys(req.user)

  res.json(result)
}

const revokeApiKey = async (req, res) => {
  const result = await apiKeysService.revokeApiKey(req.user, req.params.id)

  res.json(result)
}

module.exports = {
  createApiKey,
  listApiKeys,
  revokeApiKey,
}
