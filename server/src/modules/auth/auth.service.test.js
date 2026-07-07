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

const authRepository = require('#modules/auth/auth.repository')
const {
  buildFortyTwoProfile,
  buildGuestIdentity,
  getAuthProviders,
  getFortyTwoAuthorizeUrl,
  login,
  loginAsGuest,
  requestPasswordReset,
  resolveAvailableUsername,
  sanitizeFortyTwoLogin,
  upgradeGuestAccount,
  validateFortyTwoCallbackInput,
  validateLoginInput,
  validateRegistrationInput,
} = require('#modules/auth/auth.service')

const withRepositoryStubs = async (stubs, callback) => {
  const originals = {}

  for (const key of Object.keys(stubs)) {
    originals[key] = authRepository[key]
    authRepository[key] = stubs[key]
  }

  try {
    return await callback()
  } finally {
    for (const key of Object.keys(stubs)) {
      authRepository[key] = originals[key]
    }
  }
}

const buildAuthUser = (overrides = {}) => ({
  id: 101,
  email: 'guest-test@example.com',
  username: 'guest',
  displayName: 'Guest ABCD',
  bio: null,
  avatarUrl: null,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  rank: null,
  isGuest: true,
  isBot: false,
  role: 'USER',
  createdAt: new Date('2026-07-07T00:00:00.000Z'),
  termsAcceptedAt: null,
  privacyAcceptedAt: null,
  tokenVersion: 0,
  twoFactorChallengeVersion: 0,
  twoFactorEnabled: false,
  twoFactorPendingSecretCiphertext: null,
  failedLoginCount: 0,
  lockedOutUntil: null,
  passwordHash: null,
  ...overrides,
})

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

describe('buildGuestIdentity', () => {
  it('creates a valid guest identity', () => {
    const identity = buildGuestIdentity()

    assert.match(identity.email, /^guest-[^@]+@guest\.trackscendence\.invalid$/)
    assert.match(identity.username, /^guest[a-f0-9]{12}$/)
    assert.match(identity.displayName, /^Guest [A-F0-9]{4}$/)
  })
})

describe('loginAsGuest', () => {
  it('creates a guest user and returns a login result', async () => {
    let createdPayload

    await withRepositoryStubs(
      {
        createGuestUser: async (payload) => {
          createdPayload = payload
          return buildAuthUser(payload)
        },
      },
      async () => {
        const result = await loginAsGuest()

        assert.ok(result.token)
        assert.strictEqual(result.user.isGuest, true)
        assert.match(createdPayload.username, /^guest[a-f0-9]{12}$/)
      },
    )
  })
})

describe('upgradeGuestAccount', () => {
  const payload = {
    email: 'saved@example.com',
    username: 'player',
    password: 'StrongPass1!',
    privacyAccepted: true,
    termsAccepted: true,
  }

  it('rejects registered users', async () => {
    await withRepositoryStubs(
      {
        findAuthById: async () => buildAuthUser({ isGuest: false }),
      },
      async () => {
        await assert.rejects(() => upgradeGuestAccount({ id: 101 }, payload), {
          statusCode: 400,
        })
      },
    )
  })

  it('converts a guest into a registered account and returns a fresh token', async () => {
    let upgradePayload

    await withRepositoryStubs(
      {
        findAuthById: async () => buildAuthUser(),
        findByEmail: async () => null,
        findByUsername: async () => null,
        upgradeGuestById: async (id, data) => {
          upgradePayload = { id, ...data }

          return buildAuthUser({
            id,
            email: data.email,
            username: data.username,
            passwordHash: data.passwordHash,
            privacyAcceptedAt: data.privacyAcceptedAt,
            termsAcceptedAt: data.termsAcceptedAt,
            isGuest: false,
            tokenVersion: 1,
          })
        },
      },
      async () => {
        const result = await upgradeGuestAccount({ id: 101 }, payload)

        assert.ok(result.token)
        assert.strictEqual(result.user.email, payload.email)
        assert.strictEqual(result.user.username, payload.username)
        assert.strictEqual(result.user.isGuest, false)
        assert.notStrictEqual(upgradePayload.passwordHash, payload.password)
        assert.match(upgradePayload.passwordHash, /^\$2[aby]\$/)
      },
    )
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

describe('validateLoginInput', () => {
  it('accepts and normalizes email identifiers', () => {
    assert.deepStrictEqual(
      validateLoginInput({
        identifier: ' USER@Example.COM ',
        password: 'StrongPass1!',
      }),
      { identifier: 'user@example.com', password: 'StrongPass1!' },
    )
  })

  it('accepts and normalizes username identifiers', () => {
    assert.deepStrictEqual(
      validateLoginInput({
        identifier: ' Player ',
        password: 'StrongPass1!',
      }),
      { identifier: 'player', password: 'StrongPass1!' },
    )
  })

  it('requires an identifier and password', () => {
    assert.throws(
      () => validateLoginInput({ identifier: ' ', password: '' }),
      (error) => {
        assert.equal(error.statusCode, 400)
        assert.deepEqual(error.payload.details, [
          'Email or username is required',
          'Password is required',
        ])
        return true
      },
    )
  })
})

describe('login', () => {
  it('rejects bot accounts through the normal invalid-credentials path', async () => {
    let loginAttemptUpdates = 0

    await withRepositoryStubs(
      {
        findByIdentifier: async () =>
          buildAuthUser({
            id: 501,
            email: 'bot-uno@trackscendence.local',
            username: 'bot-uno',
            isBot: true,
            passwordHash: 'not-used',
          }),
        updateUserLoginAttempts: async () => {
          loginAttemptUpdates += 1
        },
      },
      async () => {
        await assert.rejects(
          () =>
            login({
              identifier: 'bot-uno',
              password: 'StrongPass1!',
            }),
          { statusCode: 401 },
        )

        assert.strictEqual(loginAttemptUpdates, 0)
      },
    )
  })
})

describe('requestPasswordReset', () => {
  it('does not create reset tokens for bot accounts', async () => {
    let resetTokenUpdates = 0

    await withRepositoryStubs(
      {
        findByEmail: async () =>
          buildAuthUser({
            id: 501,
            email: 'bot-uno@trackscendence.local',
            username: 'bot-uno',
            isBot: true,
          }),
        updatePasswordResetToken: async () => {
          resetTokenUpdates += 1
        },
      },
      async () => {
        const result = await requestPasswordReset({
          email: 'bot-uno@trackscendence.local',
        })

        assert.match(result.message, /If that email is registered/)
        assert.strictEqual(resetTokenUpdates, 0)
      },
    )
  })
})

describe('validateRegistrationInput', () => {
  const validPayload = {
    email: 'test@example.com',
    username: 'player',
    password: 'StrongPass1!',
    privacyAccepted: true,
    termsAccepted: true,
  }

  it('accepts registration when both policy acknowledgements are present', () => {
    assert.doesNotThrow(() => validateRegistrationInput(validPayload))
  })

  it('requires Terms and Privacy acknowledgement', () => {
    assert.throws(
      () =>
        validateRegistrationInput({
          ...validPayload,
          privacyAccepted: false,
          termsAccepted: false,
        }),
      (error) => {
        assert.equal(error.statusCode, 400)
        assert.deepEqual(error.payload.details.slice(-2), [
          'Terms of Service acceptance is required',
          'Privacy Policy acceptance is required',
        ])
        return true
      },
    )
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
