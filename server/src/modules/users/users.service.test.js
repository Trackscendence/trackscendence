const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const authTokenCache = require('#modules/auth/auth.token-cache')
const userAvatar = require('#modules/users/users.avatar')
const usersRepository = require('#modules/users/users.repository')
const { parseUserSearchQuery } = require('#modules/users/users.service')

const buildViewer = (overrides = {}) => ({
  id: 42,
  avatarUrl: null,
  ...overrides,
})

const buildSelfUser = (overrides = {}) => ({
  id: 42,
  email: 'player@example.com',
  username: 'player42',
  displayName: null,
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  rank: null,
  isGuest: false,
  role: 'USER',
  termsAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
  privacyAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
  twoFactorEnabled: false,
  twoFactorPendingSecretCiphertext: null,
  ...overrides,
})

const withUserServiceStubs = async (stubs, callback) => {
  const originals = {
    countAcceptedFriendsForUser: usersRepository.countAcceptedFriendsForUser,
    deleteAvatarFileByUrl: userAvatar.deleteAvatarFileByUrl,
    invalidate: authTokenCache.invalidate,
    listPublicFriendsForUser: usersRepository.listPublicFriendsForUser,
    listRecentMatchesForUser: usersRepository.listRecentMatchesForUser,
    storeAvatarFile: userAvatar.storeAvatarFile,
    updateAvatarById: usersRepository.updateAvatarById,
    updateProfileById: usersRepository.updateProfileById,
  }

  Object.assign(userAvatar, {
    deleteAvatarFileByUrl:
      stubs.deleteAvatarFileByUrl ?? originals.deleteAvatarFileByUrl,
    storeAvatarFile: stubs.storeAvatarFile ?? originals.storeAvatarFile,
  })
  Object.assign(usersRepository, {
    countAcceptedFriendsForUser:
      stubs.countAcceptedFriendsForUser ??
      originals.countAcceptedFriendsForUser,
    listPublicFriendsForUser:
      stubs.listPublicFriendsForUser ?? originals.listPublicFriendsForUser,
    listRecentMatchesForUser:
      stubs.listRecentMatchesForUser ?? originals.listRecentMatchesForUser,
    updateAvatarById: stubs.updateAvatarById ?? originals.updateAvatarById,
    updateProfileById: stubs.updateProfileById ?? originals.updateProfileById,
  })
  authTokenCache.invalidate = stubs.invalidate ?? originals.invalidate

  try {
    delete require.cache[require.resolve('#modules/users/users.service')]
    const freshUsersService = require('#modules/users/users.service')
    return await callback(freshUsersService)
  } finally {
    Object.assign(userAvatar, {
      deleteAvatarFileByUrl: originals.deleteAvatarFileByUrl,
      storeAvatarFile: originals.storeAvatarFile,
    })
    Object.assign(usersRepository, {
      countAcceptedFriendsForUser: originals.countAcceptedFriendsForUser,
      listPublicFriendsForUser: originals.listPublicFriendsForUser,
      listRecentMatchesForUser: originals.listRecentMatchesForUser,
      updateAvatarById: originals.updateAvatarById,
      updateProfileById: originals.updateProfileById,
    })
    authTokenCache.invalidate = originals.invalidate
    delete require.cache[require.resolve('#modules/users/users.service')]
  }
}

describe('parseUserSearchQuery', () => {
  it('trims the term and returns pagination defaults', () => {
    const result = parseUserSearchQuery({ q: '  sergio  ' })

    assert.deepStrictEqual(result, { q: 'sergio', page: 1, limit: 10 })
  })

  it('parses explicit page and limit', () => {
    const result = parseUserSearchQuery({ q: 'ser', page: '3', limit: '25' })

    assert.deepStrictEqual(result, { q: 'ser', page: 3, limit: 25 })
  })

  it('clamps limit to the maximum page size', () => {
    const result = parseUserSearchQuery({ q: 'ser', limit: '500' })

    assert.strictEqual(result.limit, 50)
  })

  it('rejects a missing term', () => {
    assert.throws(() => parseUserSearchQuery({}), { statusCode: 400 })
  })

  it('rejects a whitespace-only term', () => {
    assert.throws(() => parseUserSearchQuery({ q: '   ' }), {
      statusCode: 400,
    })
  })

  it('rejects a repeated q parameter', () => {
    assert.throws(() => parseUserSearchQuery({ q: ['a', 'b'] }), {
      statusCode: 400,
    })
  })

  it('rejects a term over 50 characters', () => {
    assert.throws(() => parseUserSearchQuery({ q: 'a'.repeat(51) }), {
      statusCode: 400,
    })
  })

  it('rejects an invalid page', () => {
    assert.throws(() => parseUserSearchQuery({ q: 'ser', page: '0' }), {
      statusCode: 400,
    })
  })
})

describe('getProfileData', () => {
  const { getProfileData } = require('#modules/users/users.service')

  const user = {
    id: 1,
    username: 'player',
    displayName: 'Player One',
    bio: null,
    avatarUrl: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    email: 'player@trackscendence.local',
    isGuest: false,
    gamesPlayed: 8,
    wins: 5,
    losses: 3,
    rank: 2,
  }

  const repositoryWithFriendCount = (friendsCount) => ({
    listRecentMatchesForUser: async () => [],
    // The preview list is capped to a handful; the count is the real total.
    listPublicFriendsForUser: async () => [],
    countAcceptedFriendsForUser: async () => friendsCount,
  })

  it('reports the true accepted-friend total in stats, beyond the preview cap', () => {
    return getProfileData(
      user,
      {},
      {
        repository: repositoryWithFriendCount(14),
      },
    ).then((profile) => {
      assert.strictEqual(profile.stats.friendsCount, 14)
      assert.strictEqual(profile.stats.wins, 5)
      assert.strictEqual(profile.stats.gamesPlayed, 8)
    })
  })

  it('keeps the existing stats fields intact', () => {
    return getProfileData(
      user,
      { includeEmail: true },
      {
        repository: repositoryWithFriendCount(0),
      },
    ).then((profile) => {
      assert.deepStrictEqual(profile.stats, {
        gamesPlayed: 8,
        wins: 5,
        losses: 3,
        rank: 2,
        friendsCount: 0,
      })
      assert.strictEqual(profile.email, 'player@trackscendence.local')
    })
  })
})

describe('auth cache invalidation after user profile mutations', () => {
  it('invalidates the auth cache after updating the current profile', async () => {
    let invalidatedUserId = null

    await withUserServiceStubs(
      {
        invalidate: (userId) => {
          invalidatedUserId = userId
        },
        countAcceptedFriendsForUser: async () => 0,
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
        updateProfileById: async () =>
          buildSelfUser({
            displayName: 'Midnight Tactician',
            bio: 'Plays the long game.',
          }),
      },
      async (usersService) => {
        const result = await usersService.updateCurrentUserProfile(
          buildViewer(),
          {
            displayName: 'Midnight Tactician',
            bio: 'Plays the long game.',
          },
        )

        assert.strictEqual(invalidatedUserId, 42)
        assert.strictEqual(result.authUser.displayName, 'Midnight Tactician')
        assert.strictEqual(result.authUser.bio, 'Plays the long game.')
      },
    )
  })

  it('invalidates the auth cache after uploading an avatar', async () => {
    let invalidatedUserId = null

    await withUserServiceStubs(
      {
        invalidate: (userId) => {
          invalidatedUserId = userId
        },
        countAcceptedFriendsForUser: async () => 0,
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
        storeAvatarFile: async () => ({
          avatarUrl: '/uploads/avatars/fresh-avatar.png',
        }),
        updateAvatarById: async () =>
          buildSelfUser({
            avatarUrl: '/uploads/avatars/fresh-avatar.png',
          }),
      },
      async (usersService) => {
        const result = await usersService.uploadCurrentUserAvatar(
          buildViewer(),
          { originalname: 'avatar.png' },
        )

        assert.strictEqual(invalidatedUserId, 42)
        assert.strictEqual(
          result.authUser.avatarUrl,
          '/uploads/avatars/fresh-avatar.png',
        )
      },
    )
  })

  it('invalidates the auth cache after deleting an avatar', async () => {
    let invalidatedUserId = null

    await withUserServiceStubs(
      {
        deleteAvatarFileByUrl: async () => {},
        invalidate: (userId) => {
          invalidatedUserId = userId
        },
        countAcceptedFriendsForUser: async () => 0,
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
        updateAvatarById: async () =>
          buildSelfUser({
            avatarUrl: null,
          }),
      },
      async (usersService) => {
        const result = await usersService.deleteCurrentUserAvatar(
          buildViewer({ avatarUrl: '/uploads/avatars/old-avatar.png' }),
        )

        assert.strictEqual(invalidatedUserId, 42)
        assert.strictEqual(result.authUser.avatarUrl, null)
      },
    )
  })
})
