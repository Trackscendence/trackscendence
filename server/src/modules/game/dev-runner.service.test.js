const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const {
  getFillPlayerNames,
  normalizePlayerName,
  pickDeclaredColor,
  playNextAction,
  resolveSpeedMs,
} = require('#modules/game/dev-runner.service')
const { COLORS } = require('#modules/game/game.constants')

describe('dev runner helpers', () => {
  it('normalizes seeded player names and run speeds', () => {
    assert.strictEqual(normalizePlayerName('uno'), 'uno')
    assert.strictEqual(normalizePlayerName('missing'), 'bot')
    assert.strictEqual(resolveSpeedMs('fast'), 350)
    assert.strictEqual(resolveSpeedMs('missing'), 900)
    assert.deepStrictEqual(getFillPlayerNames('skip', 3), [
      'skip',
      'uno',
      'bot',
    ])
  })

  it('declares the color most common in the current hand', () => {
    assert.strictEqual(
      pickDeclaredColor([
        { color: COLORS.GREEN },
        { color: COLORS.BLUE },
        { color: COLORS.GREEN },
        { color: COLORS.WILD },
      ]),
      COLORS.GREEN,
    )
  })

  it('plays the first legal card from the current player hand', () => {
    const plays = []
    const engine = {
      hasDrawnThisTurn: false,
      getState: () => ({ currentPlayer: 7 }),
      getHand: () => [
        { color: COLORS.BLUE, value: '8' },
        { color: COLORS.GREEN, value: '3' },
      ],
      canPlayCard: (card) => card.color === COLORS.GREEN,
      playCard: (...args) => plays.push(args),
    }

    playNextAction(engine)

    assert.deepStrictEqual(plays, [[7, 1, null]])
  })

  it('draws and immediately plays a playable drawn card', () => {
    const plays = []
    const engine = {
      hasDrawnThisTurn: false,
      getState: () => ({ currentPlayer: 9 }),
      getHand: () => [{ color: COLORS.BLUE, value: '8' }],
      canPlayCard: () => false,
      drawCard: () => ({ card: { color: COLORS.WILD }, playable: true }),
      playCard: (...args) => plays.push(args),
    }
    let handRead = 0
    engine.getHand = () => {
      handRead += 1
      return handRead === 1
        ? [{ color: COLORS.BLUE, value: '8' }]
        : [
            { color: COLORS.BLUE, value: '8' },
            { color: COLORS.WILD, value: 'WILD' },
          ]
    }

    playNextAction(engine)

    assert.deepStrictEqual(plays, [[9, 1, COLORS.BLUE]])
  })
})
