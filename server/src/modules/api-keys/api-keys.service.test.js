const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const {
  generateApiKey,
  hashApiKey,
  validateCreateApiKeyInput,
} = require('#modules/api-keys/api-keys.service')

describe('generateApiKey', () => {
  it('produces keys with the tsc_ prefix and 48 hex characters', () => {
    const apiKey = generateApiKey()

    assert.match(apiKey, /^tsc_[0-9a-f]{48}$/)
  })

  it('produces a different key on every call', () => {
    const generatedKeys = new Set(
      Array.from({ length: 100 }, () => generateApiKey()),
    )

    assert.strictEqual(generatedKeys.size, 100)
  })
})

describe('hashApiKey', () => {
  it('is deterministic and returns a 64-character hex digest', () => {
    const apiKey = generateApiKey()
    const firstHash = hashApiKey(apiKey)
    const secondHash = hashApiKey(apiKey)

    assert.strictEqual(firstHash, secondHash)
    assert.match(firstHash, /^[0-9a-f]{64}$/)
  })

  it('never equals the plaintext key', () => {
    const apiKey = generateApiKey()

    assert.notStrictEqual(hashApiKey(apiKey), apiKey)
  })
})

describe('validateCreateApiKeyInput', () => {
  it('accepts a valid name and trims whitespace', () => {
    const result = validateCreateApiKeyInput({ name: '  my-integration  ' })

    assert.deepStrictEqual(result, { name: 'my-integration' })
  })

  it('rejects a missing name', () => {
    assert.throws(() => validateCreateApiKeyInput({}), {
      statusCode: 400,
    })
  })

  it('rejects a name longer than 40 characters', () => {
    assert.throws(() => validateCreateApiKeyInput({ name: 'a'.repeat(41) }), {
      statusCode: 400,
    })
  })

  it('rejects a non-object body', () => {
    assert.throws(() => validateCreateApiKeyInput(['name']), {
      statusCode: 400,
    })
  })
})
