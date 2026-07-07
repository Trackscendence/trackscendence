import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cancelDeferredRoomExit,
  scheduleDeferredRoomExit,
} from './deferredRoomExit.js'

test('cancels the deferred room exit before it can leave the room', () => {
  const timerRef = { current: null }
  const calls = []
  const scheduled = new Map()

  scheduleDeferredRoomExit({
    timerRef,
    leaveRoom: () => calls.push('leaveRoom'),
    leaveLobby: () => calls.push('leaveLobby'),
    schedule: (callback) => {
      scheduled.set('timer-1', callback)
      return 'timer-1'
    },
    cancel: (timer) => scheduled.delete(timer),
  })

  cancelDeferredRoomExit({
    timerRef,
    cancel: (timer) => scheduled.delete(timer),
  })

  assert.equal(timerRef.current, null)
  assert.equal(scheduled.has('timer-1'), false)
  assert.deepEqual(calls, [])
})

test('cancels a deferred room exit scheduled by a previous mount', () => {
  const firstMountTimerRef = { current: null }
  const secondMountTimerRef = { current: null }
  const calls = []
  const scheduled = new Map()

  scheduleDeferredRoomExit({
    timerRef: firstMountTimerRef,
    leaveRoom: () => calls.push('leaveRoom'),
    leaveLobby: () => calls.push('leaveLobby'),
    schedule: (callback) => {
      scheduled.set('timer-1', callback)
      return 'timer-1'
    },
    cancel: (timer) => scheduled.delete(timer),
  })

  cancelDeferredRoomExit({
    timerRef: secondMountTimerRef,
    cancel: (timer) => scheduled.delete(timer),
  })

  assert.equal(scheduled.has('timer-1'), false)
  assert.deepEqual(calls, [])
})

test('runs both room-exit actions when the deferred cleanup is not cancelled', () => {
  const timerRef = { current: null }
  const calls = []
  let scheduledCallback = null

  scheduleDeferredRoomExit({
    timerRef,
    leaveRoom: () => calls.push('leaveRoom'),
    leaveLobby: () => calls.push('leaveLobby'),
    schedule: (callback) => {
      scheduledCallback = callback
      return 'timer-1'
    },
  })
  scheduledCallback()

  assert.equal(timerRef.current, null)
  assert.deepEqual(calls, ['leaveRoom', 'leaveLobby'])
})
