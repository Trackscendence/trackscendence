import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveFortyTwoButtonState } from './resolveFortyTwoButtonState.js'

test('a ready provider yields an enabled, ready button', () => {
  const state = resolveFortyTwoButtonState({
    comingSoon: false,
    isChecking: false,
    isConnecting: false,
  })

  assert.equal(state.isDisabled, false)
  assert.equal(state.mode, 'ready')
  assert.equal(state.title, undefined)
})

test('clicking to connect disables the button and shows the connecting state', () => {
  const state = resolveFortyTwoButtonState({
    comingSoon: false,
    isChecking: false,
    isConnecting: true,
  })

  // This is the "immediate feedback on click" behaviour: the moment the login
  // page flips isConnecting, the button is both disabled and visibly connecting.
  assert.equal(state.isDisabled, true)
  assert.equal(state.mode, 'connecting')
})

test('connecting takes visual priority over every other flag', () => {
  const state = resolveFortyTwoButtonState({
    comingSoon: true,
    isChecking: true,
    isConnecting: true,
  })

  assert.equal(state.mode, 'connecting')
  assert.equal(state.isDisabled, true)
})

test('the probe-in-flight state reads as checking and stays disabled', () => {
  const state = resolveFortyTwoButtonState({
    comingSoon: false,
    isChecking: true,
    isConnecting: false,
  })

  assert.equal(state.isDisabled, true)
  assert.equal(state.mode, 'checking')
  assert.equal(state.title, 'Checking availability')
})

test('an unconfigured provider reads as coming soon and stays disabled', () => {
  const state = resolveFortyTwoButtonState({
    comingSoon: true,
    isChecking: false,
    isConnecting: false,
  })

  assert.equal(state.isDisabled, true)
  assert.equal(state.mode, 'comingSoon')
  assert.equal(state.title, 'Coming soon')
})

test('defaults to a disabled coming-soon button when called with no flags', () => {
  const state = resolveFortyTwoButtonState()

  assert.equal(state.isDisabled, true)
  assert.equal(state.mode, 'comingSoon')
})
