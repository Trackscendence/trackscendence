const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const { parseUserSearchQuery } = require('#modules/users/users.service')

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
