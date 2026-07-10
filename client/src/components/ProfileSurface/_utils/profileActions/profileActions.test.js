import assert from 'node:assert/strict'
import test from 'node:test'
import profileActions from './profileActions.js'

const { getProfileActionState } = profileActions

test('a stranger sees an enabled Add a friend action (#395)', () => {
  for (const relationship of [undefined, null, {}, { status: 'UNKNOWN' }]) {
    const action = getProfileActionState({ relationship })
    assert.equal(action.label, 'Add a friend')
    assert.equal(action.kind, 'request')
    assert.equal(action.isDisabled, false)
    assert.equal(action.variant, 'orange')
  }
})

test('a friend gets the friends pair (handshake status plus mailbox)', () => {
  const action = getProfileActionState({
    relationship: { status: 'FRIENDS' },
  })
  assert.equal(action.kind, 'friends')
  assert.equal(action.isDisabled, false)
})

test('an outgoing pending request is a cancellable Request sent control', () => {
  const action = getProfileActionState({
    relationship: { status: 'PENDING_OUTGOING' },
  })
  assert.equal(action.label, 'Request sent')
  assert.equal(action.kind, 'cancel')
  assert.equal(action.isDisabled, false)
})

test('an incoming pending request offers Accept and Reject on the profile', () => {
  const action = getProfileActionState({
    relationship: { status: 'PENDING_INCOMING' },
  })
  assert.equal(action.kind, 'respond')
  assert.equal(action.isDisabled, false)
})

test('a blocked relationship shows a disabled Unavailable state', () => {
  const action = getProfileActionState({
    relationship: { status: 'BLOCKED' },
  })
  assert.equal(action.label, 'Unavailable')
  assert.equal(action.isDisabled, true)
})
