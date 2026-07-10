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
