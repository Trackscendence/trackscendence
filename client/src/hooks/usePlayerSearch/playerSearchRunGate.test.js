import assert from 'node:assert/strict'
import test from 'node:test'
import { createPlayerSearchRunGate } from './playerSearchRunGate.js'

test('a started run is current until another run starts', () => {
  const runGate = createPlayerSearchRunGate()
  const firstRun = runGate.beginRun()
  const secondRun = runGate.beginRun()

  assert.equal(runGate.isCurrentRun(firstRun), false)
  assert.equal(runGate.isCurrentRun(secondRun), true)
})

test('an older cleanup cannot invalidate a newer immediate run', () => {
  const runGate = createPlayerSearchRunGate()
  const debouncedRun = runGate.beginRun()
  const immediateRun = runGate.beginRun()

  runGate.supersedeRun(debouncedRun)

  assert.equal(runGate.isCurrentRun(immediateRun), true)
})

test('manual invalidation prevents a pending response from opening', () => {
  const runGate = createPlayerSearchRunGate()
  const pendingRun = runGate.beginRun()

  runGate.invalidateRun()

  assert.equal(runGate.isCurrentRun(pendingRun), false)
})

test('the current debounced cleanup invalidates its own run', () => {
  const runGate = createPlayerSearchRunGate()
  const debouncedRun = runGate.beginRun()

  runGate.supersedeRun(debouncedRun)

  assert.equal(runGate.isCurrentRun(debouncedRun), false)
})
