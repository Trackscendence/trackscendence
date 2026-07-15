const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const friendsService = require('./friends.service')

const now = new Date('2026-07-09T12:00:00.000Z')

describe('friendsService.validateRequestMessage', () => {
  it('trims optional friend-request intro messages', () => {
    assert.equal(friendsService.validateRequestMessage(' hello '), 'hello')
    assert.equal(friendsService.validateRequestMessage('   '), null)
  })

  it('caps friend-request intro messages', () => {
    assert.throws(
      () => friendsService.validateRequestMessage('x'.repeat(501)),
      (error) =>
        error.payload?.details?.[0] ===
        'message must be at most 500 characters',
    )
  })
})

describe('friendsService.toIncomingRequestSummary', () => {
  it('includes the friend-request preview message', () => {
    const summary = friendsService.toIncomingRequestSummary({
      createdAt: now,
      requestMessage: 'hello before we chat',
      requester: {
        id: 1,
        username: 'sender',
        displayName: null,
        avatarUrl: null,
      },
    })

    assert.equal(summary.message, 'hello before we chat')
  })
})

describe('friendsService.resolveBlockAction', () => {
  it('blocks an accepted friend', () => {
    assert.equal(
      friendsService.resolveBlockAction({ status: 'ACCEPTED' }, 1),
      'block',
    )
  })

  it('is a no-op when the viewer already blocked the user', () => {
    assert.equal(
      friendsService.resolveBlockAction(
        { status: 'BLOCKED', blockedById: 1 },
        1,
      ),
      'noop',
    )
  })

  it('refuses to block a user who has already blocked the viewer', () => {
    assert.throws(() =>
      friendsService.resolveBlockAction(
        { status: 'BLOCKED', blockedById: 2 },
        1,
      ),
    )
  })

  it('refuses to block a non-friend', () => {
    assert.throws(() => friendsService.resolveBlockAction(null, 1))
    assert.throws(() =>
      friendsService.resolveBlockAction({ status: 'PENDING' }, 1),
    )
  })
})

describe('friendsService.resolveUnblockAction', () => {
  it('unblocks a user the viewer blocked', () => {
    assert.equal(
      friendsService.resolveUnblockAction(
        { status: 'BLOCKED', blockedById: 1 },
        1,
      ),
      'unblock',
    )
  })

  it('is a no-op when nothing is blocked', () => {
    assert.equal(
      friendsService.resolveUnblockAction({ status: 'ACCEPTED' }, 1),
      'noop',
    )
  })

  it('refuses to unblock a block the viewer did not create', () => {
    assert.throws(() =>
      friendsService.resolveUnblockAction(
        { status: 'BLOCKED', blockedById: 2 },
        1,
      ),
    )
  })
})
