import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from './tokenStorage.js'

// The storage key is the contract other tabs and page reloads read the session
// from, so it is pinned here: changing it would silently log every user out.
const AUTH_TOKEN_KEY = 'trackscendence.auth.token'

const installFakeStorage = () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
  return store
}

test('getStoredToken returns null when localStorage is unavailable', () => {
  delete globalThis.localStorage
  assert.equal(getStoredToken(), null)
})

test('getStoredToken returns null when nothing is stored', () => {
  installFakeStorage()
  assert.equal(getStoredToken(), null)
})

test('setStoredToken then getStoredToken round-trips the value under the auth key', () => {
  const store = installFakeStorage()

  setStoredToken('token-abc')

  assert.equal(getStoredToken(), 'token-abc')
  assert.equal(store.get(AUTH_TOKEN_KEY), 'token-abc')
})

test('clearStoredToken removes the stored token', () => {
  const store = installFakeStorage()
  setStoredToken('token-abc')

  clearStoredToken()

  assert.equal(getStoredToken(), null)
  assert.equal(store.has(AUTH_TOKEN_KEY), false)
})
