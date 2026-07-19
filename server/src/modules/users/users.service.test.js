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
    findPublicProfileByUsername: usersRepository.findPublicProfileByUsername,
    findRelationshipBetweenUsers: usersRepository.findRelationshipBetweenUsers,
    findSelfProfileById: usersRepository.findSelfProfileById,
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
    findPublicProfileByUsername:
      stubs.findPublicProfileByUsername ??
      originals.findPublicProfileByUsername,
    findRelationshipBetweenUsers:
      stubs.findRelationshipBetweenUsers ??
      originals.findRelationshipBetweenUsers,
    findSelfProfileById:
      stubs.findSelfProfileById ?? originals.findSelfProfileById,
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
      findPublicProfileByUsername: originals.findPublicProfileByUsername,
      findRelationshipBetweenUsers: originals.findRelationshipBetweenUsers,
      findSelfProfileById: originals.findSelfProfileById,
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

describe('profile view reads', () => {
  it('assembles the current profile through the shared service path', async () => {
    await withUserServiceStubs(
      {
        countAcceptedFriendsForUser: async () => 2,
        findSelfProfileById: async () =>
          buildSelfUser({
            displayName: 'Current Player',
          }),
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
      },
      async (usersService) => {
        const result = await usersService.getCurrentProfile(buildViewer())

        assert.strictEqual(result.relationship.status, 'SELF')
        assert.strictEqual(result.user.email, 'player@example.com')
        assert.strictEqual(result.user.displayName, 'Current Player')
        assert.strictEqual(result.user.stats.friendsCount, 2)
      },
    )
  })

  it('assembles a public profile with no relationship as NONE', async () => {
    await withUserServiceStubs(
      {
        countAcceptedFriendsForUser: async () => 0,
        findPublicProfileByUsername: async () =>
          buildSelfUser({
            id: 7,
            email: 'public@example.com',
            username: 'public-player',
          }),
        findRelationshipBetweenUsers: async () => null,
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
      },
      async (usersService) => {
        const result = await usersService.getProfileByUsername(
          buildViewer(),
          'public-player',
        )

        assert.deepStrictEqual(result.relationship, { status: 'NONE' })
        assert.strictEqual(result.user.email, undefined)
        assert.strictEqual(result.user.username, 'public-player')
      },
    )
  })

  it('assembles a public profile with an accepted relationship as FRIENDS', async () => {
    const updatedAt = new Date('2026-07-03T12:00:00.000Z')

    await withUserServiceStubs(
      {
        countAcceptedFriendsForUser: async () => 5,
        findPublicProfileByUsername: async () =>
          buildSelfUser({
            id: 7,
            email: 'public@example.com',
            username: 'public-player',
          }),
        findRelationshipBetweenUsers: async () => ({
          requesterId: 42,
          addresseeId: 7,
          status: 'ACCEPTED',
          updatedAt,
        }),
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
      },
      async (usersService) => {
        const result = await usersService.getProfileByUsername(
          buildViewer(),
          'public-player',
        )

        assert.deepStrictEqual(result.relationship, {
          status: 'FRIENDS',
          updatedAt,
        })
        assert.strictEqual(result.user.stats.friendsCount, 5)
      },
    )
  })

  it('throws not found for a missing public profile user', async () => {
    await withUserServiceStubs(
      {
        findPublicProfileByUsername: async () => null,
      },
      async (usersService) => {
        await assert.rejects(
          usersService.getProfileByUsername(buildViewer(), 'missing-player'),
          { statusCode: 404, message: 'User not found' },
        )
      },
    )
  })
})

describe('profile assembly observability', () => {
  const buildDebugLogger = (overrides = {}) => {
    const calls = []
    const logger = {
      debug: (message, metadata) => {
        calls.push({ message, metadata })
      },
      isLevelEnabled: () => true,
      ...overrides,
    }

    return { calls, logger }
  }

  it('logs correlation id and fragment timings for current profile reads', async () => {
    const { calls, logger } = buildDebugLogger()

    await withUserServiceStubs(
      {
        countAcceptedFriendsForUser: async () => 14,
        findSelfProfileById: async () => buildSelfUser(),
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
      },
      async (usersService) => {
        const result = await usersService.getCurrentProfile(buildViewer(), {
          correlationId: 'profile-read-123',
          logger,
        })

        assert.strictEqual(result.relationship.status, 'SELF')
      },
    )

    assert.strictEqual(calls.length, 1)
    assert.strictEqual(calls[0].message, 'Profile view assembled')
    assert.strictEqual(calls[0].metadata.correlationId, 'profile-read-123')
    assert.strictEqual(calls[0].metadata.profileRead, 'current')
    assert.strictEqual(calls[0].metadata.viewerId, 42)
    assert.strictEqual(calls[0].metadata.profileUserId, 42)
    assert.ok(calls[0].metadata.durationsMs.total >= 0)
    assert.ok(calls[0].metadata.durationsMs.userLookup >= 0)
    assert.ok(calls[0].metadata.durationsMs.recentMatches >= 0)
    assert.ok(calls[0].metadata.durationsMs.friendPreview >= 0)
    assert.ok(calls[0].metadata.durationsMs.friendCount >= 0)
    assert.ok(calls[0].metadata.durationsMs.responseBuild >= 0)
    assert.strictEqual('email' in calls[0].metadata, false)
    assert.strictEqual(JSON.stringify(calls[0].metadata).includes('@'), false)
  })

  it('logs relationship lookup timing for public profile reads', async () => {
    const { calls, logger } = buildDebugLogger()

    await withUserServiceStubs(
      {
        countAcceptedFriendsForUser: async () => 3,
        findPublicProfileByUsername: async () =>
          buildSelfUser({
            id: 7,
            email: 'public@example.com',
            username: 'public-player',
          }),
        findRelationshipBetweenUsers: async () => ({
          requesterId: 42,
          addresseeId: 7,
          status: 'PENDING',
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
        }),
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
      },
      async (usersService) => {
        const result = await usersService.getProfileByUsername(
          buildViewer(),
          'public-player',
          { logger },
        )

        assert.strictEqual(result.relationship.status, 'PENDING_OUTGOING')
      },
    )

    assert.strictEqual(calls.length, 1)
    assert.strictEqual(calls[0].metadata.profileRead, 'public')
    assert.strictEqual(calls[0].metadata.viewerId, 42)
    assert.strictEqual(calls[0].metadata.profileUserId, 7)
    assert.ok(typeof calls[0].metadata.correlationId === 'string')
    assert.ok(calls[0].metadata.correlationId.length > 0)
    assert.ok(calls[0].metadata.durationsMs.relationshipLookup >= 0)
    assert.strictEqual('username' in calls[0].metadata, false)
    assert.strictEqual('email' in calls[0].metadata, false)
  })

  it('stays quiet when debug logging is disabled', async () => {
    let debugCalls = 0

    await withUserServiceStubs(
      {
        countAcceptedFriendsForUser: async () => 0,
        findSelfProfileById: async () => buildSelfUser(),
        listPublicFriendsForUser: async () => [],
        listRecentMatchesForUser: async () => [],
      },
      async (usersService) => {
        await usersService.getCurrentProfile(buildViewer(), {
          correlationId: 'quiet-profile-read',
          logger: {
            debug: () => {
              debugCalls += 1
            },
            isLevelEnabled: () => false,
          },
        })
      },
    )

    assert.strictEqual(debugCalls, 0)
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
