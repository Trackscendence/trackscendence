const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
// Pin the 42 client vars empty so the not-configured tests hold even when
// the local .env carries real credentials.
process.env.FORTYTWO_CLIENT_ID = ''
process.env.FORTYTWO_CLIENT_SECRET = ''
process.env.FORTYTWO_REDIRECT_URI = ''

const {
  buildFortyTwoProfile,
  getAuthProviders,
  getFortyTwoAuthorizeUrl,
  resolveAvailableUsername,
  sanitizeFortyTwoLogin,
  validateFortyTwoCallbackInput,
} = require('#modules/auth/auth.service')

describe('sanitizeFortyTwoLogin', () => {
  it('keeps a plain intra login as-is', () => {
    assert.strictEqual(sanitizeFortyTwoLogin('jdoe'), 'jdoe')
  })

  it('lowercases and strips characters the username rules reject', () => {
    assert.strictEqual(sanitizeFortyTwoLogin('Jean-Mic'), 'jeanmic')
  })

  it('strips leading digits so the username starts with a letter', () => {
    assert.strictEqual(sanitizeFortyTwoLogin('42alice'), 'alice')
  })

  it('falls back when nothing usable remains', () => {
    assert.strictEqual(sanitizeFortyTwoLogin('4-2_!'), 'player')
    assert.strictEqual(sanitizeFortyTwoLogin(''), 'player')
    assert.strictEqual(sanitizeFortyTwoLogin(undefined), 'player')
  })

  it('leaves room for a collision suffix within the length cap', () => {
    const sanitized = sanitizeFortyTwoLogin('a'.repeat(64))

    assert.strictEqual(sanitized.length, 28)
  })
})

describe('resolveAvailableUsername', () => {
  it('returns the base name when it is free', async () => {
    const username = await resolveAvailableUsername('jdoe', async () => false)

    assert.strictEqual(username, 'jdoe')
  })

  it('appends the first free numeric suffix on collision', async () => {
    const taken = new Set(['jdoe', 'jdoe2', 'jdoe3'])
    const username = await resolveAvailableUsername('jdoe', async (candidate) =>
      taken.has(candidate),
    )

    assert.strictEqual(username, 'jdoe4')
  })
})

describe('buildFortyTwoProfile', () => {
  const rawProfile = {
    id: 1234,
    login: 'jdoe',
    email: 'JDoe@student.42.fr',
    displayname: 'John Doe',
    image: {
      link: 'https://cdn.intra.42.fr/users/jdoe.jpg',
      versions: { medium: 'https://cdn.intra.42.fr/users/medium_jdoe.jpg' },
    },
  }

  it('maps the intra profile onto our provisioning fields', () => {
    assert.deepStrictEqual(buildFortyTwoProfile(rawProfile), {
      fortyTwoId: 1234,
      email: 'jdoe@student.42.fr',
      login: 'jdoe',
      displayName: 'John Doe',
      avatarUrl: 'https://cdn.intra.42.fr/users/medium_jdoe.jpg',
    })
  })

  it('falls back to the flat image link when versions are missing', () => {
    const profile = buildFortyTwoProfile({
      ...rawProfile,
      image: { link: rawProfile.image.link },
    })

    assert.strictEqual(profile.avatarUrl, rawProfile.image.link)
  })

  it('tolerates a missing display name and image', () => {
    const profile = buildFortyTwoProfile({
      id: 1234,
      login: 'jdoe',
      email: 'jdoe@student.42.fr',
    })

    assert.strictEqual(profile.displayName, null)
    assert.strictEqual(profile.avatarUrl, null)
  })

  it('rejects profiles missing the id, login, or email', () => {
    assert.throws(() => buildFortyTwoProfile({ login: 'x', email: 'x@y.z' }), {
      statusCode: 401,
    })
    assert.throws(() => buildFortyTwoProfile({ id: 1, email: 'x@y.z' }), {
      statusCode: 401,
    })
    assert.throws(() => buildFortyTwoProfile({ id: 1, login: 'x' }), {
      statusCode: 401,
    })
  })
})

describe('validateFortyTwoCallbackInput', () => {
  it('trims and returns the code and state', () => {
    assert.deepStrictEqual(
      validateFortyTwoCallbackInput({ code: ' abc ', state: ' def ' }),
      { code: 'abc', state: 'def' },
    )
  })

  it('rejects a missing code or state', () => {
    assert.throws(() => validateFortyTwoCallbackInput({}), { statusCode: 400 })
    assert.throws(() => validateFortyTwoCallbackInput({ code: 'abc' }), {
      statusCode: 400,
    })
  })
})

describe('getAuthProviders', () => {
  it('reports 42 as unavailable while its env vars are unset', () => {
    assert.deepStrictEqual(getAuthProviders(), { fortyTwo: false })
  })
})

describe('getFortyTwoAuthorizeUrl', () => {
  it('answers 404 while the 42 client env vars are unset', () => {
    assert.throws(() => getFortyTwoAuthorizeUrl(), { statusCode: 404 })
  })
})
