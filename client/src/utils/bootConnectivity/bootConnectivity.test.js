import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BOOT_MAX_ATTEMPTS,
  getBootRetryDelay,
  hasExhaustedBootRetries,
  isBootConnectionError,
} from './bootConnectivity.js'

test('caps boot retry delay at three seconds', () => {
  assert.equal(getBootRetryDelay(0), 500)
  assert.equal(getBootRetryDelay(1), 1000)
  assert.equal(getBootRetryDelay(2), 2000)
  assert.equal(getBootRetryDelay(3), 3000)
  assert.equal(getBootRetryDelay(4), 3000)
})

test('separates connection failures from HTTP failures', () => {
  assert.equal(isBootConnectionError(new TypeError('fetch failed')), true)
  assert.equal(isBootConnectionError(new Error('Request timed out')), true)
  assert.equal(isBootConnectionError({ status: 502 }), true)
  assert.equal(isBootConnectionError({ status: 504 }), true)
  assert.equal(isBootConnectionError({ status: 500 }), false)
  assert.equal(isBootConnectionError({ status: 503 }), false)
})

test('exhausts boot retries only on the final attempt', () => {
  assert.equal(hasExhaustedBootRetries(0), false)
  assert.equal(hasExhaustedBootRetries(BOOT_MAX_ATTEMPTS - 2), false)
  assert.equal(hasExhaustedBootRetries(BOOT_MAX_ATTEMPTS - 1), true)
  assert.equal(hasExhaustedBootRetries(BOOT_MAX_ATTEMPTS), true)
})
