const crypto = require('node:crypto')
const BadRequestException = require('#exceptions/bad-request.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const UnauthorizedException = require('#exceptions/unauthorized.exception')
const apiKeysRepository = require('#modules/api-keys/api-keys.repository')
const logger = require('#utils/logger')

const API_KEY_PREFIX = 'tsc_'
const API_KEY_RANDOM_BYTES = 24
const KEY_PREFIX_DISPLAY_LENGTH = 12
const NAME_MAX_LENGTH = 40
const MAX_ACTIVE_KEYS_PER_USER = 5

const generateApiKey = () => {
  return `${API_KEY_PREFIX}${crypto.randomBytes(API_KEY_RANDOM_BYTES).toString('hex')}`
}

// High-entropy random keys only need a fast one-way hash for storage; the
// unique hash column gives O(1) lookup on every public API request.
const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

const validateCreateApiKeyInput = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('Invalid request data', {
      details: ['Request body must be an object'],
    })
  }

  const details = []
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''

  if (!name) {
    details.push('Name is required')
  } else if (name.length > NAME_MAX_LENGTH) {
    details.push(`Name must be at most ${NAME_MAX_LENGTH} characters`)
  }

  if (details.length > 0) {
    throw new BadRequestException('Invalid request data', { details })
  }

  return { name }
}

const createApiKey = async (viewer, payload) => {
  const { name } = validateCreateApiKeyInput(payload)

  const activeKeyCount = await apiKeysRepository.countActiveApiKeysForUser(
    viewer.id,
  )

  if (activeKeyCount >= MAX_ACTIVE_KEYS_PER_USER) {
    throw new BadRequestException(
      `You can have at most ${MAX_ACTIVE_KEYS_PER_USER} active API keys`,
    )
  }

  const plaintextKey = generateApiKey()
  const apiKey = await apiKeysRepository.createApiKey({
    userId: viewer.id,
    name,
    keyHash: hashApiKey(plaintextKey),
    keyPrefix: plaintextKey.slice(0, KEY_PREFIX_DISPLAY_LENGTH),
  })

  return {
    message: 'API key created. Store it now: it is only shown once.',
    apiKey: { ...apiKey, key: plaintextKey },
  }
}

const listApiKeys = async (viewer) => {
  const apiKeys = await apiKeysRepository.listApiKeysForUser(viewer.id)

  return { apiKeys }
}

const revokeApiKey = async (viewer, rawApiKeyId) => {
  const apiKeyId = Number(rawApiKeyId)

  if (!Number.isInteger(apiKeyId) || apiKeyId < 1) {
    throw new BadRequestException('Invalid request data', {
      details: ['API key id must be a positive integer'],
    })
  }

  const { count } = await apiKeysRepository.revokeApiKeyForUser(
    viewer.id,
    apiKeyId,
  )

  if (count === 0) {
    throw new NotFoundException('API key not found')
  }

  return { message: 'API key revoked' }
}

const getUserForApiKey = async (presentedKey) => {
  if (!presentedKey || typeof presentedKey !== 'string') {
    throw new UnauthorizedException('Missing API key')
  }

  const apiKey = await apiKeysRepository.findActiveApiKeyByHash(
    hashApiKey(presentedKey),
  )

  if (!apiKey) {
    throw new UnauthorizedException('Invalid or revoked API key')
  }

  apiKeysRepository.touchApiKeyLastUsed(apiKey.id).catch((error) => {
    logger.warn(`Failed to update API key last-used time: ${error.message}`)
  })

  return apiKey.user
}

module.exports = {
  createApiKey,
  generateApiKey,
  getUserForApiKey,
  hashApiKey,
  listApiKeys,
  revokeApiKey,
  validateCreateApiKeyInput,
}
