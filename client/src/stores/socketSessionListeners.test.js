import assert from 'node:assert/strict'
import test from 'node:test'
import {
  attachSocketSessionListeners,
  detachSocketSessionListeners,
} from './socketSessionListeners.js'

class FakeSocket {
  constructor() {
    this.listeners = new Map()
  }

  on(event, handler) {
    const listeners = this.listeners.get(event) ?? []
    listeners.push(handler)
    this.listeners.set(event, listeners)
  }

  off(event, handler) {
    const listeners = this.listeners.get(event) ?? []
    this.listeners.set(
      event,
      listeners.filter((listener) => listener !== handler),
    )
  }

  listenerCount(event) {
    return this.listeners.get(event)?.length ?? 0
  }
}

test('attaches each socket session listener once', () => {
  const socket = new FakeSocket()
  const handlers = {
    connect: () => {},
    rooms_update: () => {},
  }

  attachSocketSessionListeners(socket, handlers)
  attachSocketSessionListeners(socket, handlers)

  assert.equal(socket.listenerCount('connect'), 1)
  assert.equal(socket.listenerCount('rooms_update'), 1)
})

test('detaches socket session listeners', () => {
  const socket = new FakeSocket()
  const handlers = {
    connect: () => {},
    rooms_update: () => {},
  }

  attachSocketSessionListeners(socket, handlers)
  detachSocketSessionListeners(socket, handlers)

  assert.equal(socket.listenerCount('connect'), 0)
  assert.equal(socket.listenerCount('rooms_update'), 0)
})
