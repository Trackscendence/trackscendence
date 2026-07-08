import assert from 'node:assert/strict'
import test from 'node:test'
import SimEngine from './simEngine.js'

const allCardsFor = (engine) => [
  ...engine.drawPile,
  ...engine.discardPile,
  ...Array.from(engine.hands.values()).flat(),
]

test('simulation deck includes the custom Wild Draw Three cards', () => {
  const engine = new SimEngine(['one', 'two', 'three', 'four'])
  const cards = allCardsFor(engine)

  assert.equal(cards.length, 112)
  assert.equal(
    cards.filter((card) => card.value === 'WILD_DRAW_THREE').length,
    4,
  )
})

test('simulation Wild Draw Three makes the next player draw three and skips them', () => {
  const engine = Object.create(SimEngine.prototype)
  engine.hands = new Map([
    [
      'one',
      [
        { type: 'WILD', color: 'WILD', value: 'WILD_DRAW_THREE' },
        { type: 'NUMBER', color: 'BLUE', value: '9' },
      ],
    ],
    ['two', []],
    ['three', []],
  ])
  engine.playerOrder = ['one', 'two', 'three']
  engine.drawPile = [
    { type: 'NUMBER', color: 'BLUE', value: '1' },
    { type: 'NUMBER', color: 'GREEN', value: '2' },
    { type: 'NUMBER', color: 'YELLOW', value: '3' },
  ]
  engine.discardPile = [{ type: 'NUMBER', color: 'BLUE', value: '5' }]
  engine.currentPlayerIndex = 0
  engine.playDirection = 1
  engine.currentColor = 'BLUE'
  engine.winner = null
  engine.hasDrawnThisTurn = false

  engine.playCard('one', 0, 'RED')

  assert.equal(engine.currentColor, 'RED')
  assert.equal(engine.hands.get('two').length, 3)
  assert.equal(engine.playerOrder[engine.currentPlayerIndex], 'three')
})
