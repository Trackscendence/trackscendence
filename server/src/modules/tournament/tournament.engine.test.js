const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const engine = require('#modules/tournament/tournament.engine')

// Keeps seed order equal to entry order, so bracket layouts are predictable.
const identityShuffle = (items) => [...items]

// Reversal is enough to prove the shuffle actually drives the seeding.
const reverseShuffle = (items) => [...items].reverse()

// Turns buildBracket specs into rows the way the database would: each match
// gains an id so applyResult can address it.
const toMatchRows = (specs) =>
  specs.map((spec, index) => ({ id: index + 1, winnerId: null, ...spec }))

// Applies a result and folds the reported writes back into the rows, giving
// the same view a re-read from the database would give.
const applyAndFold = (rows, matchId, winnerId) => {
  const result = engine.applyResult(rows, matchId, winnerId)
  const nextRows = rows.map((row) => {
    if (row.id === matchId) return result.updatedMatch
    if (result.promotion && row.id === result.promotion.matchId) {
      const seatField =
        result.promotion.side === 'A' ? 'playerAId' : 'playerBId'
      return { ...row, [seatField]: result.promotion.playerId }
    }
    return row
  })
  return { result, rows: nextRows }
}

describe('computeTotalRounds', () => {
  it('maps bracket sizes to round counts', () => {
    assert.equal(engine.computeTotalRounds(4), 2)
    assert.equal(engine.computeTotalRounds(8), 3)
  })

  it('rejects a size that is not a power of two', () => {
    assert.throws(() => engine.computeTotalRounds(6), /power of two/)
    assert.throws(() => engine.computeTotalRounds(0), /power of two/)
  })
})

describe('buildBracket', () => {
  it('is deterministic under an identity shuffle', () => {
    const { seededPlayerIds, matches } = engine.buildBracket([10, 20, 30, 40], {
      shuffle: identityShuffle,
    })

    assert.deepEqual(seededPlayerIds, [10, 20, 30, 40])
    assert.deepEqual(matches, [
      { round: 1, slot: 0, playerAId: 10, playerBId: 20 },
      { round: 1, slot: 1, playerAId: 30, playerBId: 40 },
      { round: 2, slot: 0, playerAId: null, playerBId: null },
    ])
  })

  it('seeds through the injected shuffle', () => {
    const { seededPlayerIds, matches } = engine.buildBracket([10, 20, 30, 40], {
      shuffle: reverseShuffle,
    })

    assert.deepEqual(seededPlayerIds, [40, 30, 20, 10])
    assert.deepEqual(matches[0], {
      round: 1,
      slot: 0,
      playerAId: 40,
      playerBId: 30,
    })
  })

  it('lays out an 8-player bracket as 4 + 2 + 1 matches', () => {
    const playerIds = [1, 2, 3, 4, 5, 6, 7, 8]
    const { matches } = engine.buildBracket(playerIds, {
      shuffle: identityShuffle,
    })

    const roundSizes = matches.reduce((sizes, match) => {
      sizes[match.round] = (sizes[match.round] || 0) + 1
      return sizes
    }, {})
    assert.deepEqual(roundSizes, { 1: 4, 2: 2, 3: 1 })
    assert.ok(
      matches
        .filter((match) => match.round > 1)
        .every((match) => match.playerAId === null && match.playerBId === null),
    )
  })

  it('does not mutate the caller player list', () => {
    const playerIds = [10, 20, 30, 40]
    engine.buildBracket(playerIds, { shuffle: reverseShuffle })
    assert.deepEqual(playerIds, [10, 20, 30, 40])
  })
})

describe('nextSeat', () => {
  it('sends adjacent slots to the same next-round match on opposite sides', () => {
    assert.deepEqual(engine.nextSeat(1, 0), { round: 2, slot: 0, side: 'A' })
    assert.deepEqual(engine.nextSeat(1, 1), { round: 2, slot: 0, side: 'B' })
    assert.deepEqual(engine.nextSeat(1, 2), { round: 2, slot: 1, side: 'A' })
    assert.deepEqual(engine.nextSeat(1, 3), { round: 2, slot: 1, side: 'B' })
    assert.deepEqual(engine.nextSeat(2, 1), { round: 3, slot: 0, side: 'B' })
  })
})

describe('applyResult', () => {
  it('runs a 4-player tournament to a champion', () => {
    let rows = toMatchRows(
      engine.buildBracket([10, 20, 30, 40], { shuffle: identityShuffle })
        .matches,
    )

    let step = applyAndFold(rows, 1, 10)
    rows = step.rows
    assert.equal(step.result.loserId, 20)
    assert.deepEqual(step.result.promotion, {
      matchId: 3,
      round: 2,
      slot: 0,
      side: 'A',
      playerId: 10,
    })
    assert.equal(step.result.roundComplete, false)
    assert.equal(step.result.tournamentComplete, false)

    step = applyAndFold(rows, 2, 40)
    rows = step.rows
    assert.equal(step.result.loserId, 30)
    assert.equal(step.result.promotion.side, 'B')
    assert.equal(step.result.roundComplete, true)
    assert.equal(step.result.tournamentComplete, false)

    const finalMatch = rows.find((row) => row.id === 3)
    assert.equal(finalMatch.playerAId, 10)
    assert.equal(finalMatch.playerBId, 40)

    step = applyAndFold(rows, 3, 40)
    assert.equal(step.result.promotion, null)
    assert.equal(step.result.loserId, 10)
    assert.equal(step.result.roundComplete, true)
    assert.equal(step.result.tournamentComplete, true)
  })

  it('runs an 8-player tournament to a champion', () => {
    const playerIds = [1, 2, 3, 4, 5, 6, 7, 8]
    let rows = toMatchRows(
      engine.buildBracket(playerIds, { shuffle: identityShuffle }).matches,
    )

    // Quarterfinals: the lower-numbered player of each pair wins.
    for (const [matchId, winnerId] of [
      [1, 1],
      [2, 3],
      [3, 5],
      [4, 7],
    ]) {
      const step = applyAndFold(rows, matchId, winnerId)
      rows = step.rows
      assert.equal(step.result.tournamentComplete, false)
      assert.equal(step.result.roundComplete, matchId === 4)
    }

    const semifinals = rows.filter((row) => row.round === 2)
    assert.deepEqual(
      semifinals.map((row) => [row.playerAId, row.playerBId]),
      [
        [1, 3],
        [5, 7],
      ],
    )

    let step = applyAndFold(rows, 5, 3)
    rows = step.rows
    step = applyAndFold(rows, 6, 5)
    rows = step.rows
    assert.equal(step.result.roundComplete, true)

    const finalMatch = rows.find((row) => row.round === 3)
    assert.deepEqual([finalMatch.playerAId, finalMatch.playerBId], [3, 5])

    step = applyAndFold(rows, finalMatch.id, 5)
    assert.equal(step.result.tournamentComplete, true)
    assert.equal(step.result.promotion, null)
    assert.equal(step.result.updatedMatch.winnerId, 5)
  })

  it('accepts results out of order within a round', () => {
    let rows = toMatchRows(
      engine.buildBracket([1, 2, 3, 4, 5, 6, 7, 8], {
        shuffle: identityShuffle,
      }).matches,
    )

    // The last quarterfinal reports first; the round is not complete until
    // every other quarterfinal has reported too.
    let step = applyAndFold(rows, 4, 8)
    rows = step.rows
    assert.equal(step.result.roundComplete, false)
    assert.deepEqual(step.result.promotion, {
      matchId: 6,
      round: 2,
      slot: 1,
      side: 'B',
      playerId: 8,
    })

    step = applyAndFold(rows, 2, 4)
    rows = step.rows
    step = applyAndFold(rows, 3, 6)
    rows = step.rows
    assert.equal(step.result.roundComplete, false)

    step = applyAndFold(rows, 1, 2)
    assert.equal(step.result.roundComplete, true)
  })

  it('rejects a result for an unknown match', () => {
    const rows = toMatchRows(
      engine.buildBracket([10, 20, 30, 40], { shuffle: identityShuffle })
        .matches,
    )
    assert.throws(() => engine.applyResult(rows, 99, 10), /match not found/)
  })

  it('rejects a double report', () => {
    let rows = toMatchRows(
      engine.buildBracket([10, 20, 30, 40], { shuffle: identityShuffle })
        .matches,
    )
    rows = applyAndFold(rows, 1, 10).rows
    assert.throws(
      () => engine.applyResult(rows, 1, 10),
      /already been recorded/,
    )
    assert.throws(
      () => engine.applyResult(rows, 1, 20),
      /already been recorded/,
    )
  })

  it('rejects a result for a half-seated match', () => {
    let rows = toMatchRows(
      engine.buildBracket([10, 20, 30, 40], { shuffle: identityShuffle })
        .matches,
    )
    rows = applyAndFold(rows, 1, 10).rows

    // The final has only seat A filled; a result for it is premature.
    assert.throws(() => engine.applyResult(rows, 3, 10), /both players seated/)
  })

  it('rejects a winner who is not in the match', () => {
    const rows = toMatchRows(
      engine.buildBracket([10, 20, 30, 40], { shuffle: identityShuffle })
        .matches,
    )
    assert.throws(
      () => engine.applyResult(rows, 1, 30),
      /not a player in this match/,
    )
  })

  it('does not mutate the given match rows', () => {
    const rows = toMatchRows(
      engine.buildBracket([10, 20, 30, 40], { shuffle: identityShuffle })
        .matches,
    )
    const snapshot = JSON.parse(JSON.stringify(rows))
    engine.applyResult(rows, 1, 10)
    assert.deepEqual(rows, snapshot)
  })
})
