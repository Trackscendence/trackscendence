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

test('a friend gets the friends pair (handshake badge plus mailbox)', () => {
  const action = getProfileActionState({
    relationship: { status: 'FRIENDS' },
  })
  assert.equal(action.kind, 'friends')
  assert.equal(action.isDisabled, false)
})

test('an outgoing pending request shows a disabled Request sent state', () => {
  const action = getProfileActionState({
    relationship: { status: 'PENDING_OUTGOING' },
  })
  assert.equal(action.label, 'Request sent')
  assert.equal(action.isDisabled, true)
  assert.equal(action.variant, 'orangeOutline')
})

test('an incoming pending request shows a disabled Request received state', () => {
  const action = getProfileActionState({
    relationship: { status: 'PENDING_INCOMING' },
  })
  assert.equal(action.label, 'Request received')
  assert.equal(action.isDisabled, true)
})

test('a blocked relationship shows a disabled Unavailable state', () => {
  const action = getProfileActionState({
    relationship: { status: 'BLOCKED' },
  })
  assert.equal(action.label, 'Unavailable')
  assert.equal(action.isDisabled, true)
})
