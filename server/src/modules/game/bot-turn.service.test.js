const { describe, it, mock, afterEach } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const gameStore = require('#modules/game/game.store')
const botPlayers = require('#modules/game/bot-player.service')
const botTurns = require('#modules/game/bot-turn.service')

const createEngine = (currentPlayer = 9) => ({
  winner: null,
  getState: () => ({ currentPlayer }),
})

describe('bot turn scheduler', () => {
  afterEach(() => {
    mock.restoreAll()
    botTurns.clearAllBotTurnTimers(() => {})
  })

  it('does not schedule when the current player is human', () => {
    mock.method(gameStore, 'getEngine', () => createEngine(7))
    mock.method(botPlayers, 'isBotUserId', () => false)

    const scheduled = botTurns.scheduleBotTurn({
      io: {},
      gameId: 'game-1',
      broadcastGameState: () => {},
      checkGameEnd: async () => {},
      schedule: () => 'timer-1',
    })

    assert.equal(scheduled, false)
    assert.equal(botTurns.getScheduledBotTurnCount(), 0)
  })

  it('keeps only one pending timer per game', () => {
    const cancelled = []
    let timerIndex = 0
    mock.method(gameStore, 'getEngine', () => createEngine(9))
    mock.method(botPlayers, 'isBotUserId', () => true)

    botTurns.scheduleBotTurn({
      io: {},
      gameId: 'game-2',
      broadcastGameState: () => {},
      checkGameEnd: async () => {},
      schedule: () => `timer-${++timerIndex}`,
      cancel: (timer) => cancelled.push(timer),
    })
    botTurns.scheduleBotTurn({
      io: {},
      gameId: 'game-2',
      broadcastGameState: () => {},
      checkGameEnd: async () => {},
      schedule: () => `timer-${++timerIndex}`,
      cancel: (timer) => cancelled.push(timer),
    })

    assert.deepStrictEqual(cancelled, ['timer-1'])
    assert.equal(botTurns.getScheduledBotTurnCount(), 1)
  })

  it('deletes the timer before running the bot turn', async () => {
    let scheduledCallback
    const broadcasts = []
    const engine = createEngine(9)
    mock.method(gameStore, 'getEngine', () => engine)
    mock.method(botPlayers, 'isBotUserId', () => true)
    mock.method(botPlayers, 'playNextAction', (engine) => {
      engine.winner = 9
    })

    botTurns.scheduleBotTurn({
      io: {},
      gameId: 'game-3',
      broadcastGameState: (...args) => broadcasts.push(args),
      checkGameEnd: async () => {},
      schedule: (callback) => {
        scheduledCallback = callback
        return 'timer-3'
      },
    })

    assert.equal(botTurns.getScheduledBotTurnCount(), 1)
    await scheduledCallback()

    assert.equal(botTurns.getScheduledBotTurnCount(), 0)
    assert.equal(broadcasts.length, 1)
  })

  it('clears a pending timer explicitly', () => {
    const cancelled = []
    mock.method(gameStore, 'getEngine', () => createEngine(9))
    mock.method(botPlayers, 'isBotUserId', () => true)

    botTurns.scheduleBotTurn({
      io: {},
      gameId: 'game-4',
      broadcastGameState: () => {},
      checkGameEnd: async () => {},
      schedule: () => 'timer-4',
    })
    botTurns.clearBotTurnTimer('game-4', (timer) => cancelled.push(timer))

    assert.deepStrictEqual(cancelled, ['timer-4'])
    assert.equal(botTurns.getScheduledBotTurnCount(), 0)
  })
})
