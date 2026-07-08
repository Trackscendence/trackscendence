const { describe, it, mock, afterEach } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const botPlayerRepository = require('#modules/game/bot-player.repository')
const botPlayers = require('#modules/game/bot-player.service')
const { CARD_TYPES, COLORS, VALUES } = require('#modules/game/game.constants')

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
        bio: player.bio,
        avatarUrl: player.avatarUrl,
      }),
    )

    const users = await botPlayers.ensureBotPlayers(2)

    assert.equal(upsertMock.mock.callCount(), 2)
    assert.equal(users.length, 2)
    assert.equal(botPlayers.isBotUserId(users[0].id), true)
    assert.equal(upsertMock.mock.calls[0].arguments[0].username, 'bot-uno')
    assert.match(upsertMock.mock.calls[0].arguments[0].bio, /Balanced/)
    assert.equal(
      upsertMock.mock.calls[0].arguments[0].avatarUrl,
      '/bot-avatars/uno.svg',
    )
    assert.equal(
      botPlayers.getBotStrategyForUserId(users[1].id),
      botPlayers.BOT_STRATEGIES.TEMPO,
    )
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

  it('uses the tempo strategy to spend action cards before numbers', () => {
    botPlayers.rememberBotUsers([{ id: 21, username: 'bot-skip' }])
    const plays = []
    const engine = {
      hasDrawnThisTurn: false,
      getState: () => ({ currentPlayer: 21 }),
      getHand: () => [
        { type: CARD_TYPES.NUMBER, color: COLORS.GREEN, value: VALUES.THREE },
        { type: CARD_TYPES.ACTION, color: COLORS.GREEN, value: VALUES.SKIP },
      ],
      canPlayCard: (card) => card.color === COLORS.GREEN,
      playCard: (...args) => plays.push(args),
    }

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(plays, [[21, 1, null]])
  })

  it('uses the pressure strategy to spend draw cards before numbers', () => {
    botPlayers.rememberBotUsers([{ id: 22, username: 'bot-draw' }])
    const plays = []
    const engine = {
      hasDrawnThisTurn: false,
      getState: () => ({ currentPlayer: 22 }),
      getHand: () => [
        { type: CARD_TYPES.NUMBER, color: COLORS.GREEN, value: VALUES.THREE },
        {
          type: CARD_TYPES.ACTION,
          color: COLORS.GREEN,
          value: VALUES.DRAW_TWO,
        },
      ],
      canPlayCard: (card) => card.color === COLORS.GREEN,
      playCard: (...args) => plays.push(args),
    }

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(plays, [[22, 1, null]])
  })

  it('uses the leader strategy to avoid the shortest hand color', () => {
    botPlayers.rememberBotUsers([{ id: 23, username: 'bot-reverse' }])
    const plays = []
    const engine = {
      hasDrawnThisTurn: false,
      getState: () => ({
        currentPlayer: 23,
        playerHandsSizes: { 23: 2, 31: 1, 41: 5 },
      }),
      getHand: (playerId) =>
        String(playerId) === '31'
          ? [
              {
                type: CARD_TYPES.NUMBER,
                color: COLORS.RED,
                value: VALUES.ONE,
              },
              {
                type: CARD_TYPES.NUMBER,
                color: COLORS.RED,
                value: VALUES.TWO,
              },
            ]
          : [
              {
                type: CARD_TYPES.NUMBER,
                color: COLORS.RED,
                value: VALUES.FIVE,
              },
              {
                type: CARD_TYPES.NUMBER,
                color: COLORS.GREEN,
                value: VALUES.FIVE,
              },
            ],
      canPlayCard: (card) => card.value === VALUES.FIVE,
      playCard: (...args) => plays.push(args),
    }

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(plays, [[23, 1, null]])
  })

  it('uses the closer strategy to save a playable drawn wild card', () => {
    botPlayers.rememberBotUsers([{ id: 24, username: 'bot-wild' }])
    const passes = []
    const plays = []
    const engine = {
      hasDrawnThisTurn: true,
      getState: () => ({ currentPlayer: 24 }),
      getHand: () => [
        { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.EIGHT },
        { type: CARD_TYPES.NUMBER, color: COLORS.GREEN, value: VALUES.THREE },
        { type: CARD_TYPES.WILD, color: COLORS.WILD, value: VALUES.WILD },
      ],
      canPlayCard: (card) => card.color === COLORS.WILD,
      playCard: (...args) => plays.push(args),
      pass: (...args) => passes.push(args),
    }

    botPlayers.playNextAction(engine)

    assert.deepStrictEqual(plays, [])
    assert.deepStrictEqual(passes, [[24]])
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

describe('bot UNO helpers (#353)', () => {
  const fakeEngine = (unoState, log) => ({
    getState: () => ({ unoState }),
    callUno: (id) => log.push(['call', id]),
    catchUno: (id) => log.push(['catch', id]),
  })

  it('self-calls UNO when on one card and not yet called', () => {
    const log = []
    const called = botPlayers.callUnoIfNeeded(
      fakeEngine({ playerId: 900, called: false }, log),
      900,
    )
    assert.strictEqual(called, true)
    assert.deepStrictEqual(log, [['call', 900]])
  })

  it('does not self-call with no window or when already called', () => {
    const log = []
    assert.strictEqual(
      botPlayers.callUnoIfNeeded(fakeEngine(null, log), 900),
      false,
    )
    assert.strictEqual(
      botPlayers.callUnoIfNeeded(
        fakeEngine({ playerId: 900, called: true }, log),
        900,
      ),
      false,
    )
    assert.deepStrictEqual(log, [])
  })

  it('catches a forgetful human when the roll is within probability', () => {
    botPlayers.rememberBotUsers([{ id: 900, username: 'bot-uno' }])
    const log = []
    const caught = botPlayers.maybeCatchUno(
      fakeEngine({ playerId: 5, called: false }, log),
      () => 0.1,
    )
    assert.strictEqual(caught, 5)
    assert.deepStrictEqual(log, [['catch', 5]])
  })

  it('skips the catch on a missed roll, an already-called player, or a bot target', () => {
    botPlayers.rememberBotUsers([{ id: 900, username: 'bot-uno' }])
    const log = []
    assert.strictEqual(
      botPlayers.maybeCatchUno(
        fakeEngine({ playerId: 5, called: false }, log),
        () => 0.95,
      ),
      null,
    )
    assert.strictEqual(
      botPlayers.maybeCatchUno(
        fakeEngine({ playerId: 5, called: true }, log),
        () => 0.1,
      ),
      null,
    )
    assert.strictEqual(
      botPlayers.maybeCatchUno(
        fakeEngine({ playerId: 900, called: false }, log),
        () => 0.1,
      ),
      null,
    )
    assert.deepStrictEqual(log, [])
  })
})
