const test = require('node:test')
const assert = require('node:assert')
const UnoEngine = require('./game.engine')
const { COLORS, VALUES, CARD_TYPES, GAME_RULES } = require('./game.constants')

test('UnoEngine Deck and Setup Tests', async (t) => {
  await t.test(
    'Deck is initialized with 112 cards (108 + 4 Wild Draw Three)',
    () => {
      const game = new UnoEngine(['p1', 'p2'])
      let totalCards = game.drawPile.length + game.discardPile.length
      Object.values(game.players).forEach((hand) => {
        totalCards += hand.length
      })
      assert.strictEqual(totalCards, 112)
    },
  )

  await t.test('Deck has the correct distribution of cards', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Re-initialize a standard deck without dealing to easily count cards
    game.initDeck()

    const wildCount = game.drawPile.filter(
      (c) => c.value === VALUES.WILD,
    ).length
    const wildDrawFourCount = game.drawPile.filter(
      (c) => c.value === VALUES.WILD_DRAW_FOUR,
    ).length
    const wildDrawThreeCount = game.drawPile.filter(
      (c) => c.value === VALUES.WILD_DRAW_THREE,
    ).length
    assert.strictEqual(wildCount, 4)
    assert.strictEqual(wildDrawFourCount, 4)
    assert.strictEqual(wildDrawThreeCount, 4)

    const colors = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE]
    colors.forEach((color) => {
      const colorCards = game.drawPile.filter((c) => c.color === color)
      // Standard UNO has 25 cards per color (one 0, two of 1-9, two skips, two reverses, two draw-twos)
      assert.strictEqual(colorCards.length, 25)

      const zeros = colorCards.filter((c) => c.value === VALUES.ZERO)
      assert.strictEqual(zeros.length, 1)

      const ones = colorCards.filter((c) => c.value === VALUES.ONE)
      assert.strictEqual(ones.length, 2)
    })
  })

  await t.test('Deals exactly CARDS_PER_PLAYER to each player', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    // Recreate a pre-start deal state to avoid opening-card side effects.
    game.players = { p1: [], p2: [], p3: [] }
    game.discardPile = []
    game.initDeck()
    game.shuffleDeck()
    game.dealCards()
    assert.strictEqual(game.players['p1'].length, GAME_RULES.CARDS_PER_PLAYER)
    assert.strictEqual(game.players['p2'].length, GAME_RULES.CARDS_PER_PLAYER)
    assert.strictEqual(game.players['p3'].length, GAME_RULES.CARDS_PER_PLAYER)
  })
})

test('UnoEngine Constructor Validations', async (t) => {
  await t.test('Throws when less than 2 players', () => {
    assert.throws(
      () => new UnoEngine(['p1']),
      /A game must have between 2 and 10 players/,
    )
  })

  await t.test('Throws when more than 10 players', () => {
    const players = Array.from({ length: 11 }, (_, i) => `p${i}`)
    assert.throws(
      () => new UnoEngine(players),
      /A game must have between 2 and 10 players/,
    )
  })

  await t.test('Throws on duplicate player IDs', () => {
    assert.throws(
      () => new UnoEngine(['p1', 'p1']),
      /Player IDs must be unique/,
    )
  })

  await t.test('Throws when playerIds is not an array', () => {
    assert.throws(
      () => new UnoEngine('not-an-array'),
      /Player IDs must be an array/,
    )
  })
})

test('UnoEngine Game Start Rules', async (t) => {
  await t.test('First card is never a Wild Draw Four', () => {
    // Run multiple times to verify the loop works
    for (let i = 0; i < 20; i++) {
      const game = new UnoEngine(['p1', 'p2'])
      const topCard = game.getTopCard()
      assert.notStrictEqual(topCard.value, VALUES.WILD_DRAW_FOUR)
    }
  })

  await t.test('Starting color is resolved for starting Wild card', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Force startGame() to draw a Wild from the top of drawPile (array end).
    game.discardPile = []
    game.drawPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.ONE },
      { type: CARD_TYPES.WILD, color: COLORS.WILD, value: VALUES.WILD },
    ]
    game.startGame()
    assert.strictEqual(game.getTopCard().value, VALUES.WILD)
    assert.ok(
      [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE].includes(
        game.currentColor,
      ),
    )
  })
})

test('UnoEngine Play Logic & Turn Flow', async (t) => {
  await t.test('Players must play in correct order', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    // Reset order
    game.currentPlayerIndex = 0
    game.playDirection = 1

    const state = game.getState()
    const firstPlayer = state.currentPlayer
    assert.strictEqual(firstPlayer, 'p1')

    // p2 playing out of turn should throw
    assert.throws(() => game.playCard('p2', 0), /Not your turn/)
  })

  await t.test('canPlayCard checks color and value matches', () => {
    const game = new UnoEngine(['p1', 'p2'])
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.FIVE },
    ]
    game.currentColor = COLORS.RED

    // Matching color
    assert.strictEqual(
      game.canPlayCard({
        type: CARD_TYPES.NUMBER,
        color: COLORS.RED,
        value: VALUES.THREE,
      }),
      true,
    )
    // Matching value
    assert.strictEqual(
      game.canPlayCard({
        type: CARD_TYPES.NUMBER,
        color: COLORS.BLUE,
        value: VALUES.FIVE,
      }),
      true,
    )
    // Wild card
    assert.strictEqual(
      game.canPlayCard({
        type: CARD_TYPES.WILD,
        color: COLORS.WILD,
        value: VALUES.WILD,
      }),
      true,
    )
    // Non-matching card
    assert.strictEqual(
      game.canPlayCard({
        type: CARD_TYPES.NUMBER,
        color: COLORS.GREEN,
        value: VALUES.NINE,
      }),
      false,
    )
  })

  await t.test('Normal card play advances turn', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    // Give 2 cards so it doesn't trigger a win
    game.players['p1'] = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.FIVE },
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO },
    ]
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
    ]
    game.currentColor = COLORS.RED

    game.playCard('p1', 0)
    assert.strictEqual(game.players['p1'].length, 1)
    assert.strictEqual(game.getTopCard().value, VALUES.FIVE)
    assert.strictEqual(game.getState().currentPlayer, 'p2')
  })
})

test('UnoEngine Action Card Side Effects', async (t) => {
  await t.test('Reverse card reverses direction', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    // 2 cards to avoid winning
    game.players['p1'] = [
      { type: CARD_TYPES.ACTION, color: COLORS.RED, value: VALUES.REVERSE },
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO },
    ]
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
    ]
    game.currentColor = COLORS.RED

    assert.strictEqual(game.getState().playDirection, 1)
    game.playCard('p1', 0)
    assert.strictEqual(game.getState().playDirection, -1)
    // Clockwise: p1 -> p2 -> p3. Reverted: p1 -> p3.
    assert.strictEqual(game.getState().currentPlayer, 'p3')
  })

  await t.test('Skip card skips next turn', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    // 2 cards to avoid winning
    game.players['p1'] = [
      { type: CARD_TYPES.ACTION, color: COLORS.RED, value: VALUES.SKIP },
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO },
    ]
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
    ]
    game.currentColor = COLORS.RED

    game.playCard('p1', 0)
    // p2 is skipped, so currentPlayer should be p3
    assert.strictEqual(game.getState().currentPlayer, 'p3')
  })

  await t.test('Draw Two makes next player draw 2 and skips their turn', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    const initialHandSizeP2 = game.players['p2'].length
    // 2 cards to avoid winning
    game.players['p1'] = [
      { type: CARD_TYPES.ACTION, color: COLORS.RED, value: VALUES.DRAW_TWO },
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO },
    ]
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
    ]
    game.currentColor = COLORS.RED

    game.playCard('p1', 0)
    assert.strictEqual(game.players['p2'].length, initialHandSizeP2 + 2)
    assert.strictEqual(game.getState().currentPlayer, 'p3')
  })

  await t.test(
    'Wild Draw Four shifts player turn, draws 4, skips, and sets color',
    () => {
      const game = new UnoEngine(['p1', 'p2', 'p3'])
      // Reset turn state
      game.currentPlayerIndex = 0
      game.playDirection = 1
      game.hasDrawnThisTurn = false
      game.drawnCardThisTurn = null

      const initialHandSizeP2 = game.players['p2'].length
      // 2 cards to avoid winning
      game.players['p1'] = [
        {
          type: CARD_TYPES.WILD,
          color: COLORS.WILD,
          value: VALUES.WILD_DRAW_FOUR,
        },
        { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO },
      ]
      game.discardPile = [
        { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
      ]
      game.currentColor = COLORS.RED

      game.playCard('p1', 0, COLORS.GREEN)
      assert.strictEqual(game.players['p2'].length, initialHandSizeP2 + 4)
      assert.strictEqual(game.getState().currentColor, COLORS.GREEN)
      assert.strictEqual(game.getState().currentPlayer, 'p3')
    },
  )

  await t.test(
    'Wild Draw Three shifts player turn, draws 3, skips, and sets color',
    () => {
      const game = new UnoEngine(['p1', 'p2', 'p3'])
      game.currentPlayerIndex = 0
      game.playDirection = 1
      game.hasDrawnThisTurn = false
      game.drawnCardThisTurn = null

      const initialHandSizeP2 = game.players['p2'].length
      // 2 cards to avoid winning
      game.players['p1'] = [
        {
          type: CARD_TYPES.WILD,
          color: COLORS.WILD,
          value: VALUES.WILD_DRAW_THREE,
        },
        { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO },
      ]
      game.discardPile = [
        { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
      ]
      game.currentColor = COLORS.RED

      game.playCard('p1', 0, COLORS.YELLOW)
      assert.strictEqual(game.players['p2'].length, initialHandSizeP2 + 3)
      assert.strictEqual(game.getState().currentColor, COLORS.YELLOW)
      assert.strictEqual(game.getState().currentPlayer, 'p3')
    },
  )
})

test('UnoEngine Draw and Play / Pass Rules', async (t) => {
  await t.test('Drawn card not playable: turn auto-advances', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    // Place a card that p1 definitely cannot match
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.NINE },
    ]
    game.currentColor = COLORS.RED

    // Force draw pile to have a non-matching card at the top (pop pulls from the end of array)
    game.drawPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.ZERO },
    ]

    const result = game.drawCard('p1')
    assert.strictEqual(result.playable, false)
    assert.strictEqual(result.card.color, COLORS.BLUE)
    // Since it's not playable, turn auto-advances to p2
    assert.strictEqual(game.getState().currentPlayer, 'p2')
  })

  await t.test(
    'Drawn card is playable: turn does not auto-advance, player can play or pass',
    () => {
      const game = new UnoEngine(['p1', 'p2'])
      // Reset turn state
      game.currentPlayerIndex = 0
      game.playDirection = 1
      game.hasDrawnThisTurn = false
      game.drawnCardThisTurn = null

      game.discardPile = [
        { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.NINE },
      ]
      game.currentColor = COLORS.RED
      game.drawPile = [
        { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.FIVE },
      ] // matches RED

      const result = game.drawCard('p1')
      assert.strictEqual(result.playable, true)
      // Turn does not auto-advance, it is still p1's turn
      assert.strictEqual(game.getState().currentPlayer, 'p1')

      // If p1 passes now, turn advances to p2
      game.pass('p1')
      assert.strictEqual(game.getState().currentPlayer, 'p2')
    },
  )

  await t.test('Cannot pass if player has not drawn this turn', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    assert.throws(() => game.pass('p1'), /Must draw a card before passing/)
  })

  await t.test('Cannot draw twice in a single turn', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.NINE },
    ]
    game.currentColor = COLORS.RED
    // pop pulls from end, so RED FIVE is drawn first (playable)
    game.drawPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.ZERO },
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.FIVE },
    ]

    game.drawCard('p1')
    assert.throws(() => game.drawCard('p1'), /Already drew a card this turn/)
  })

  await t.test('After drawing, can only play the drawn card', () => {
    const game = new UnoEngine(['p1', 'p2'])
    // Reset turn state
    game.currentPlayerIndex = 0
    game.playDirection = 1
    game.hasDrawnThisTurn = false
    game.drawnCardThisTurn = null

    // Setup player hand with a valid red card that is NOT the drawn one
    game.players['p1'] = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.ONE }, // valid color match
      { type: CARD_TYPES.NUMBER, color: COLORS.BLUE, value: VALUES.TWO }, // invalid match
    ]
    game.discardPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.NINE },
    ]
    game.currentColor = COLORS.RED

    // Drawn card is playable (red value three)
    game.drawPile = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.THREE },
    ]

    const result = game.drawCard('p1')
    assert.strictEqual(result.playable, true)

    // Hand should now have index 0 (RED ONE), index 1 (BLUE TWO), index 2 (RED THREE - drawn)
    assert.strictEqual(game.players['p1'].length, 3)

    // Trying to play the hand's starting RED ONE (index 0) should throw, even though color matches
    assert.throws(
      () => game.playCard('p1', 0),
      /Can only play the drawn card after drawing/,
    )

    // Playing the drawn card (index 2) should succeed
    game.playCard('p1', 2)
    assert.strictEqual(game.getState().currentPlayer, 'p2')
  })
})

test.describe('Scoring (#197)', () => {
  test('cardPoints scores number cards at face value', () => {
    const game = new UnoEngine(['p1', 'p2'])
    assert.strictEqual(
      game.cardPoints({
        type: CARD_TYPES.NUMBER,
        color: COLORS.RED,
        value: VALUES.ZERO,
      }),
      0,
    )
    assert.strictEqual(
      game.cardPoints({
        type: CARD_TYPES.NUMBER,
        color: COLORS.BLUE,
        value: VALUES.SEVEN,
      }),
      7,
    )
    assert.strictEqual(
      game.cardPoints({
        type: CARD_TYPES.NUMBER,
        color: COLORS.GREEN,
        value: VALUES.NINE,
      }),
      9,
    )
  })

  test('cardPoints scores action cards at 20', () => {
    const game = new UnoEngine(['p1', 'p2'])
    for (const value of [VALUES.SKIP, VALUES.REVERSE, VALUES.DRAW_TWO]) {
      assert.strictEqual(
        game.cardPoints({ type: CARD_TYPES.ACTION, color: COLORS.RED, value }),
        20,
      )
    }
  })

  test('cardPoints scores wild cards at 50', () => {
    const game = new UnoEngine(['p1', 'p2'])
    for (const value of [
      VALUES.WILD,
      VALUES.WILD_DRAW_THREE,
      VALUES.WILD_DRAW_FOUR,
    ]) {
      assert.strictEqual(
        game.cardPoints({ type: CARD_TYPES.WILD, color: COLORS.WILD, value }),
        50,
      )
    }
  })

  test('getScores is all zeros while no winner is set', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    assert.deepStrictEqual(game.getScores(), { p1: 0, p2: 0, p3: 0 })
  })

  test('the winner collects the sum of every opponent hand', () => {
    const game = new UnoEngine(['p1', 'p2', 'p3'])
    game.winner = 'p1'
    game.players['p1'] = []
    // 5 + 20 (skip) = 25
    game.players['p2'] = [
      { type: CARD_TYPES.NUMBER, color: COLORS.RED, value: VALUES.FIVE },
      { type: CARD_TYPES.ACTION, color: COLORS.BLUE, value: VALUES.SKIP },
    ]
    // 50 (wild draw four) + 3 = 53
    game.players['p3'] = [
      {
        type: CARD_TYPES.WILD,
        color: COLORS.WILD,
        value: VALUES.WILD_DRAW_FOUR,
      },
      { type: CARD_TYPES.NUMBER, color: COLORS.GREEN, value: VALUES.THREE },
    ]

    const scores = game.getScores()
    assert.strictEqual(scores.p1, 78)
    assert.strictEqual(scores.p2, 0)
    assert.strictEqual(scores.p3, 0)
  })

  test('getState exposes the scores map', () => {
    const game = new UnoEngine(['p1', 'p2'])
    game.winner = 'p1'
    game.players['p1'] = []
    game.players['p2'] = [
      { type: CARD_TYPES.NUMBER, color: COLORS.YELLOW, value: VALUES.EIGHT },
    ]
    assert.deepStrictEqual(game.getState().scores, { p1: 8, p2: 0 })
  })
})
