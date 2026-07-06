const { describe, it } = require('node:test')
const assert = require('node:assert')
const UnoEngine = require('#modules/game/game.engine')
const { buildGameStatePayload } = require('#modules/game/game.contract')

// The realtime contract's central privacy guarantee (#94/#198): the
// game_state_update a player receives carries their own hand and nobody
// else's cards — only hand sizes for the others.
describe('buildGameStatePayload (no hand leak)', () => {
  it('gives each player their own hand and only sizes for the rest', () => {
    const engine = new UnoEngine(['p1', 'p2', 'p3'])
    const gameId = 'game-123'

    const payloadForP1 = buildGameStatePayload({
      engine,
      gameId,
      playerId: 'p1',
    })

    // P1 sees exactly P1's real hand.
    assert.deepStrictEqual(payloadForP1.myHand, engine.getHand('p1'))
    // Everyone's hand sizes are visible...
    assert.deepStrictEqual(payloadForP1.playerHandsSizes, {
      p1: 7,
      p2: 7,
      p3: 7,
    })
    // ...but no opponent's actual cards ride along anywhere in the payload.
    const serialized = JSON.stringify(payloadForP1)
    const p2Cards = JSON.stringify(engine.getHand('p2'))
    const p3Cards = JSON.stringify(engine.getHand('p3'))
    assert.ok(
      !serialized.includes(p2Cards),
      'payload must not contain p2 cards',
    )
    assert.ok(
      !serialized.includes(p3Cards),
      'payload must not contain p3 cards',
    )
  })

  it('carries the gameId and the public state fields', () => {
    const engine = new UnoEngine(['p1', 'p2'])
    const payload = buildGameStatePayload({
      engine,
      gameId: 'g-1',
      playerId: 'p1',
    })

    assert.strictEqual(payload.gameId, 'g-1')
    assert.ok('topCard' in payload)
    assert.ok('currentPlayer' in payload)
    assert.ok('deckSize' in payload)
    // The one private field is scoped to the recipient's own hand.
    assert.ok(Array.isArray(payload.myHand))
  })

  it('never exposes the engine internal players map', () => {
    const engine = new UnoEngine(['p1', 'p2'])
    const state = engine.getState()
    // getState is the public surface the payload spreads; it must not hand
    // out the raw per-player card arrays.
    assert.strictEqual(state.players, undefined)
    assert.strictEqual(state.myHand, undefined)
    assert.deepStrictEqual(Object.keys(state.playerHandsSizes).sort(), [
      'p1',
      'p2',
    ])
  })

  it('reflects a different recipient in each build', () => {
    const engine = new UnoEngine(['p1', 'p2'])
    const forP1 = buildGameStatePayload({ engine, gameId: 'g', playerId: 'p1' })
    const forP2 = buildGameStatePayload({ engine, gameId: 'g', playerId: 'p2' })

    assert.deepStrictEqual(forP1.myHand, engine.getHand('p1'))
    assert.deepStrictEqual(forP2.myHand, engine.getHand('p2'))
    // The two hands are dealt from one deck, so they never coincide.
    assert.notDeepStrictEqual(forP1.myHand, forP2.myHand)
  })
})
