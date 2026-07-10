import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { create } from 'zustand'
import { createSessionStore, resetSessionStores } from './createSessionStore.js'

const getDefaultState = () => ({
  items: [],
  unreadCount: 0,
})

const buildSessionStore = () =>
  createSessionStore((set) => ({
    ...getDefaultState(),
    addItem: (item) =>
      set((state) => ({
        items: [...state.items, item],
        unreadCount: state.unreadCount + 1,
      })),
    reset: () => set(getDefaultState()),
  }))

test('resetSessionStores clears every registered store back to defaults', () => {
  const firstStore = buildSessionStore()
  const secondStore = buildSessionStore()

  firstStore.getState().addItem('previous user data')
  secondStore.getState().addItem('more previous user data')
  assert.equal(firstStore.getState().unreadCount, 1)

  resetSessionStores()

  assert.deepEqual(firstStore.getState().items, [])
  assert.equal(firstStore.getState().unreadCount, 0)
  assert.deepEqual(secondStore.getState().items, [])
  assert.equal(secondStore.getState().unreadCount, 0)
})

test('actions still work after a session reset', () => {
  const store = buildSessionStore()

  store.getState().addItem('before reset')
  resetSessionStores()
  store.getState().addItem('after reset')

  assert.deepEqual(store.getState().items, ['after reset'])
  assert.equal(store.getState().unreadCount, 1)
})

test('a plain create store is not registered and keeps its state', () => {
  const plainStore = create((set) => ({
    items: ['kept'],
    reset: () => set({ items: [] }),
  }))

  resetSessionStores()

  assert.deepEqual(plainStore.getState().items, ['kept'])
})

test('resetSessionStores is idempotent on already-empty stores', () => {
  const store = buildSessionStore()

  resetSessionStores()
  resetSessionStores()

  assert.deepEqual(store.getState().items, [])
  assert.equal(store.getState().unreadCount, 0)
})

test('warns when a session store is created without a reset action', () => {
  const warn = mock.method(console, 'warn', () => {})

  try {
    const store = createSessionStore((set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    }))

    assert.equal(warn.mock.callCount(), 1)
    assert.match(warn.mock.calls[0].arguments[0], /reset/)

    store.getState().addItem('unmanaged')
    resetSessionStores()
    assert.deepEqual(store.getState().items, ['unmanaged'])
  } finally {
    warn.mock.restore()
  }
})
