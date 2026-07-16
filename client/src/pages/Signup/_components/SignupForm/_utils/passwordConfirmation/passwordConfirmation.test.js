import assert from 'node:assert/strict'
import test from 'node:test'

import { validatePasswordConfirmation } from './passwordConfirmation.js'

test('rejects mismatched passwords', () => {
  assert.equal(
    validatePasswordConfirmation({
      password: 'StrongPass1!',
      confirmPassword: 'StrongPass2!',
    }),
    'Passwords do not match',
  )
})

test('accepts matching passwords', () => {
  assert.equal(
    validatePasswordConfirmation({
      password: 'StrongPass1!',
      confirmPassword: 'StrongPass1!',
    }),
    null,
  )
})
