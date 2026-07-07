const { describe, it, afterEach } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const turnTimers = require('#modules/game/turn-timer.service')

describe('turn timer registry', () => {
  afterEach(() => {
    turnTimers.clearAllTurnTimers(() => {})
  })

  it('arms one timer and fires onExpire when the window elapses', () => {
    const fired = []
    let captured = null
    turnTimers.armTurnTimer({
      gameId: 'game-1',
      onExpire: (gameId) => fired.push(gameId),
      durationMs: 15000,
      schedule: (fn) => {
        captured = fn
        return 'timer-1'
      },
      cancel: () => {},
    })

    assert.equal(turnTimers.getScheduledTurnTimerCount(), 1)
    assert.deepEqual(fired, [])

    // Drive the clock: the scheduled callback removes itself, then notifies.
    captured()
    assert.deepEqual(fired, ['game-1'])
    assert.equal(turnTimers.getScheduledTurnTimerCount(), 0)
  })

  it('keeps only one pending timer per game and cancels the old one', () => {
    const cancelled = []
    let index = 0
    const arm = () =>
      turnTimers.armTurnTimer({
        gameId: 'game-2',
        onExpire: () => {},
        schedule: () => `timer-${++index}`,
        cancel: (timer) => cancelled.push(timer),
      })

    arm()
    arm()

    assert.deepEqual(cancelled, ['timer-1'])
    assert.equal(turnTimers.getScheduledTurnTimerCount(), 1)
  })

  it('clearTurnTimer cancels and removes a single game', () => {
    const cancelled = []
    turnTimers.armTurnTimer({
      gameId: 'game-3',
      onExpire: () => {},
      schedule: () => 'timer-3',
      cancel: (timer) => cancelled.push(timer),
    })

    turnTimers.clearTurnTimer('game-3', (timer) => cancelled.push(timer))
    assert.deepEqual(cancelled, ['timer-3'])
    assert.equal(turnTimers.getScheduledTurnTimerCount(), 0)

    // Clearing an unknown game is a no-op.
    turnTimers.clearTurnTimer('missing', () => {
      throw new Error('should not cancel a game with no timer')
    })
  })

  it('clearAllTurnTimers drains every pending timer', () => {
    const cancelled = []
    for (const gameId of ['a', 'b', 'c']) {
      turnTimers.armTurnTimer({
        gameId,
        onExpire: () => {},
        schedule: () => `timer-${gameId}`,
        cancel: (timer) => cancelled.push(timer),
      })
    }
    assert.equal(turnTimers.getScheduledTurnTimerCount(), 3)

    turnTimers.clearAllTurnTimers((timer) => cancelled.push(timer))
    assert.deepEqual(cancelled.sort(), ['timer-a', 'timer-b', 'timer-c'])
    assert.equal(turnTimers.getScheduledTurnTimerCount(), 0)
  })
})
