const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { runExclusiveRoomAction } = require('./room-action-guard')

describe('runExclusiveRoomAction', () => {
  it('skips duplicate actions while the first action is in flight', async () => {
    const inFlight = new Map()
    let releaseAction
    let actionRuns = 0

    const first = runExclusiveRoomAction(
      'room-entry:7',
      () =>
        new Promise((resolve) => {
          actionRuns += 1
          releaseAction = () => resolve('seated')
        }),
      { inFlight },
    )
    const duplicate = await runExclusiveRoomAction(
      'room-entry:7',
      async () => {
        actionRuns += 1
        return 'duplicate'
      },
      { inFlight },
    )

    assert.deepStrictEqual(duplicate, { skipped: true })
    assert.strictEqual(actionRuns, 1)
    assert.strictEqual(inFlight.has('room-entry:7'), true)

    releaseAction()
    assert.deepStrictEqual(await first, { skipped: false, value: 'seated' })
    assert.strictEqual(inFlight.has('room-entry:7'), false)
  })

  it('cleans up the in-flight key when an action fails', async () => {
    const inFlight = new Map()

    await assert.rejects(
      () =>
        runExclusiveRoomAction(
          'room-entry:7',
          async () => {
            throw new Error('database unavailable')
          },
          { inFlight },
        ),
      /database unavailable/,
    )

    assert.strictEqual(inFlight.has('room-entry:7'), false)
  })
})
