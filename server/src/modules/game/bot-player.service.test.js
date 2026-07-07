const { describe, it, mock, afterEach } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const botPlayerRepository = require('#modules/game/bot-player.repository')
const botPlayers = require('#modules/game/bot-player.service')
const { COLORS } = require('#modules/game/game.constants')

describe('bot player helpers', () => {
  afterEach(() => mock.restoreAll())

  it('marks ensured users as bot players', async () => {
    let nextId = 100
    const upsertMock = mock.method(
      botPlayerRepository,
      'upsertBotPlayer',
      async (player) => ({
        id: nextId++,
        username: player.username,
        displayName: player.displayName,
        avatarUrl: null,
      }),
    )

    const users = await botPlayers.ensureBotPlayers(2)

    assert.equal(upsertMock.mock.callCount(), 2)
    assert.equal(users.length, 2)
    assert.equal(botPlayers.isBotUserId(users[0].id), true)
    assert.equal(upsertMock.mock.calls[0].arguments[0].username, 'bot-uno')
  })

  it('declares the most common color in the current hand', () => {
    assert.strictEqual(
      botPlayers.pickDeclaredColor([
        { color: COLORS.GREEN },
        { color: COLORS.BLUE },
        { color: COLORS.GREEN },
        { color: COLORS.WILD },
      ]),
      COLORS.GREEN,
    )
  })

  it('plays the first legal card from the current hand', () => {
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

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(plays, [[7, 1, null]])
  })

  it('draws and immediately plays a playable drawn card', () => {
    const plays = []
    const engine = {
      hasDrawnThisTurn: false,
      getState: () => ({ currentPlayer: 9 }),
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

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(plays, [[9, 1, COLORS.BLUE]])
  })

  it('passes when the already drawn card cannot be played', () => {
    const passes = []
    const engine = {
      hasDrawnThisTurn: true,
      getState: () => ({ currentPlayer: 11 }),
      getHand: () => [{ color: COLORS.BLUE, value: '8' }],
      canPlayCard: () => false,
      pass: (...args) => passes.push(args),
    }

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(passes, [[11]])
  })
})
