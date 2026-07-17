import assert from 'node:assert/strict'
import test from 'node:test'
import {
  replaceUser,
  removeUser,
  withPending,
  withoutPending,
} from './adminStore.helpers.js'

test('replaceUser merges the response row into the matching user only', () => {
  const users = [
    { id: 1, username: 'ada', status: 'ACTIVE', wins: 4 },
    { id: 2, username: 'bo', status: 'ACTIVE', wins: 9 },
  ]

  const result = replaceUser(users, { id: 2, status: 'BANNED' })

  assert.deepEqual(result[0], users[0])
  // The merge reconciles the changed field and keeps the ones the response
  // did not include.
  assert.deepEqual(result[1], {
    id: 2,
    username: 'bo',
    status: 'BANNED',
    wins: 9,
  })
  // No in-place mutation: the original list still holds the old row.
  assert.equal(users[1].status, 'ACTIVE')
})

test('replaceUser without a response row returns the list unchanged', () => {
  const users = [{ id: 1, username: 'ada' }]

  assert.equal(replaceUser(users, undefined), users)
})

test('removeUser drops only the matching id', () => {
  const users = [{ id: 1 }, { id: 2 }, { id: 3 }]

  assert.deepEqual(removeUser(users, 2), [{ id: 1 }, { id: 3 }])
  assert.equal(users.length, 3)
})

test('withPending and withoutPending are symmetric and non-mutating', () => {
  const empty = {}
  const pending = withPending(empty, 7, 'ban')

  assert.deepEqual(pending, { 7: 'ban' })
  assert.deepEqual(empty, {})

  const cleared = withoutPending(pending, 7)

  assert.deepEqual(cleared, {})
  // Clearing an id that is not pending is a safe no-op.
  assert.deepEqual(withoutPending(cleared, 7), {})
  assert.deepEqual(pending, { 7: 'ban' })
})
