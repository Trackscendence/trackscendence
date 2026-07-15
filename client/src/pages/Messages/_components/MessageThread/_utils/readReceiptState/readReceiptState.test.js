import assert from 'node:assert/strict'
import test from 'node:test'
import { getMessageReceiptState } from './readReceiptState.js'

const conversation = {
  friendLastReadAt: '2026-07-09T12:05:00.000Z',
  lastReadAt: '2026-07-09T12:10:00.000Z',
}

test('own messages read from the friend cursor', () => {
  assert.deepEqual(
    getMessageReceiptState({
      conversation,
      currentUserId: 1,
      message: {
        senderId: 1,
        createdAt: '2026-07-09T12:04:00.000Z',
      },
    }),
    { isOwn: true, isRead: true },
  )

  assert.deepEqual(
    getMessageReceiptState({
      conversation,
      currentUserId: 1,
      message: {
        senderId: 1,
        createdAt: '2026-07-09T12:06:00.000Z',
      },
    }),
    { isOwn: true, isRead: false },
  )
})

test('incoming messages read from the viewer cursor', () => {
  assert.deepEqual(
    getMessageReceiptState({
      conversation,
      currentUserId: 1,
      message: {
        senderId: 2,
        createdAt: '2026-07-09T12:09:00.000Z',
      },
    }),
    { isOwn: false, isRead: true },
  )

  assert.deepEqual(
    getMessageReceiptState({
      conversation,
      currentUserId: 1,
      message: {
        senderId: 2,
        createdAt: '2026-07-09T12:11:00.000Z',
      },
    }),
    { isOwn: false, isRead: false },
  )
})

test('missing or malformed cursors leave the receipt unread', () => {
  assert.equal(
    getMessageReceiptState({
      conversation: {
        friendLastReadAt: null,
        lastReadAt: 'not-a-date',
      },
      currentUserId: 1,
      message: {
        senderId: 2,
        createdAt: '2026-07-09T12:09:00.000Z',
      },
    }).isRead,
    false,
  )
})
