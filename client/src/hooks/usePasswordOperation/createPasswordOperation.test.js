import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPasswordOperation,
  deriveSubmitError,
} from './createPasswordOperation.js'

// Records every setter call the pure core makes, standing in for React's
// useState setters so the submit/reset/fail behavior can be checked without a
// renderer.
const createRecorder = (operation) => {
  const calls = { error: [], validationDetails: [], isSubmitting: [] }
  const ops = createPasswordOperation({
    operation,
    setError: (value) => calls.error.push(value),
    setValidationDetails: (value) => calls.validationDetails.push(value),
    setIsSubmitting: (value) => calls.isSubmitting.push(value),
  })
  return { ...ops, calls }
}

test('submit runs the operation and returns ok with its result on success', async () => {
  const { submit, calls } = createRecorder(
    async (payload) => `saved:${payload}`,
  )

  const outcome = await submit('x')

  assert.deepEqual(outcome, { ok: true, result: 'saved:x' })
  // Clears any prior error at the start, then toggles submitting true then false.
  assert.deepEqual(calls.error, [''])
  assert.deepEqual(calls.validationDetails, [[]])
  assert.deepEqual(calls.isSubmitting, [true, false])
})

test('submit surfaces server validation details on failure', async () => {
  const failure = {
    payload: { details: ['Too short', 'No symbol'] },
    message: 'Invalid',
  }
  const { submit, calls } = createRecorder(async () => {
    throw failure
  })

  const outcome = await submit({ newPassword: 'x' })

  assert.equal(outcome.ok, false)
  assert.equal(outcome.error, failure)
  // Details win: the field list is shown and the plain error line is cleared.
  assert.deepEqual(calls.validationDetails.at(-1), ['Too short', 'No symbol'])
  assert.equal(calls.error.at(-1), '')
  assert.deepEqual(calls.isSubmitting, [true, false])
})

test('submit falls back to the error message when there are no details', async () => {
  const { submit, calls } = createRecorder(async () => {
    throw { message: 'Current password is wrong' }
  })

  const outcome = await submit({})

  assert.equal(outcome.ok, false)
  assert.deepEqual(calls.validationDetails.at(-1), [])
  assert.equal(calls.error.at(-1), 'Current password is wrong')
})

test('submit always clears the submitting flag, even when the operation throws', async () => {
  const { submit, calls } = createRecorder(async () => {
    throw new Error('boom')
  })

  await submit({})

  assert.equal(calls.isSubmitting.at(-1), false)
})

test('reset clears the error and the validation details', () => {
  const { reset, calls } = createRecorder(async () => {})

  reset()

  assert.equal(calls.error.at(-1), '')
  assert.deepEqual(calls.validationDetails.at(-1), [])
})

test('fail sets a plain client-side error and clears any details', () => {
  const { fail, calls } = createRecorder(async () => {})

  fail('Passwords do not match')

  assert.deepEqual(calls.validationDetails.at(-1), [])
  assert.equal(calls.error.at(-1), 'Passwords do not match')
})

test('deriveSubmitError maps details, message, and malformed shapes', () => {
  assert.deepEqual(
    deriveSubmitError({ payload: { details: ['a'] }, message: 'm' }),
    {
      validationDetails: ['a'],
      error: '',
    },
  )
  assert.deepEqual(deriveSubmitError({ message: 'm' }), {
    validationDetails: [],
    error: 'm',
  })
  // Details present but not an array is treated as no details.
  assert.deepEqual(
    deriveSubmitError({ payload: { details: 'nope' }, message: 'm' }),
    {
      validationDetails: [],
      error: 'm',
    },
  )
  // Nothing usable at all still yields a defined, empty state.
  assert.deepEqual(deriveSubmitError({}), { validationDetails: [], error: '' })
})
