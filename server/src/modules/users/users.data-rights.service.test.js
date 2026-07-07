const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const {
  buildAccountDataExport,
  buildAnonymizedUserData,
  validateDeleteAccountInput,
} = require('#modules/users/users.data-rights.service')

describe('validateDeleteAccountInput', () => {
  it('requires the exact username confirmation', () => {
    assert.throws(
      () => validateDeleteAccountInput({ confirmation: 'wrong' }, 'player'),
      { statusCode: 400 },
    )
  })

  it('accepts confirmation that matches after trimming', () => {
    assert.deepEqual(
      validateDeleteAccountInput({ confirmation: ' player ' }, 'player'),
      { confirmation: 'player' },
    )
  })
})

describe('buildAnonymizedUserData', () => {
  it('scrubs personal and security fields while invalidating tokens', () => {
    const deletedAt = new Date('2026-07-07T02:30:00.000Z')
    const data = buildAnonymizedUserData(42, deletedAt)

    assert.equal(data.email, 'deleted-42@deleted.trackscendence.invalid')
    assert.equal(data.username, 'deleted-42')
    assert.equal(data.displayName, 'Deleted user')
    assert.equal(data.bio, null)
    assert.equal(data.avatarUrl, null)
    assert.equal(data.passwordHash, null)
    assert.equal(data.fortyTwoId, null)
    assert.equal(data.twoFactorEnabled, false)
    assert.deepEqual(data.tokenVersion, { increment: 1 })
    assert.equal(data.deletedAt, deletedAt)
  })
})

describe('buildAccountDataExport', () => {
  it('exports account data without credential secrets', () => {
    const generatedAt = new Date('2026-07-07T02:40:00.000Z')
    const createdAt = new Date('2026-07-01T10:00:00.000Z')
    const user = {
      id: 7,
      email: 'player@example.com',
      username: 'player',
      displayName: 'Player One',
      bio: 'Ready',
      avatarUrl: '/uploads/avatar.png',
      fortyTwoId: null,
      role: 'USER',
      createdAt,
      updatedAt: createdAt,
      termsAcceptedAt: createdAt,
      privacyAcceptedAt: createdAt,
      deletedAt: null,
      gamesPlayed: 1,
      wins: 1,
      losses: 0,
      rank: 3,
      twoFactorEnabled: true,
      apiKeys: [
        {
          id: 5,
          name: 'stats',
          keyPrefix: 'tsc_abc123',
          lastUsedAt: null,
          revokedAt: null,
          createdAt,
          updatedAt: createdAt,
        },
      ],
      games: [],
      outgoingFriendships: [],
      incomingFriendships: [],
      ownedRooms: [],
      roomMemberships: [],
    }

    const payload = buildAccountDataExport(user, generatedAt)

    assert.equal(payload.generatedAt, generatedAt)
    assert.equal(payload.account.email, 'player@example.com')
    assert.deepEqual(payload.stats, {
      gamesPlayed: 1,
      wins: 1,
      losses: 0,
      rank: 3,
    })
    assert.equal(payload.security.twoFactorEnabled, true)
    assert.deepEqual(Object.keys(payload.security.apiKeys[0]), [
      'id',
      'name',
      'keyPrefix',
      'lastUsedAt',
      'revokedAt',
      'createdAt',
      'updatedAt',
    ])
    assert.equal('passwordHash' in payload.account, false)
  })
})
