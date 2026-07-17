const { describe, it } = require('node:test')
const assert = require('node:assert')

const {
  refreshUserRanks,
  updateLifetimeStatsForUsers,
} = require('#modules/game/game.stats')

const renderTaggedSql = (args) => {
  const [strings, ...values] = args

  return strings.reduce((sql, chunk, index) => {
    const value = values[index]

    if (value && typeof value === 'object' && Array.isArray(value.strings)) {
      return sql + chunk + value.sql
    }

    return sql + chunk + (value === undefined ? '' : '?')
  }, '')
}

describe('updateLifetimeStatsForUsers', () => {
  it('skips the recompute when no valid user ids remain', async () => {
    let called = false
    const tx = {
      $executeRaw: async () => {
        called = true
      },
    }

    await updateLifetimeStatsForUsers(tx, [null, undefined, '7', NaN])

    assert.equal(called, false)
  })

  it('anchors the recompute on User rows so removed game history resets stats to zero', async () => {
    const calls = []
    const tx = {
      $executeRaw: async (...args) => {
        calls.push(args)
      },
    }

    await updateLifetimeStatsForUsers(tx, [7, 7, '11', 11, null])

    assert.equal(calls.length, 1)

    const sql = renderTaggedSql(calls[0])
    const userIds = calls[0][1]?.values

    assert.deepStrictEqual(userIds, [7, 11])
    assert.match(sql, /FROM "User" target/)
    assert.match(sql, /LEFT JOIN "GamePlayer" gp ON gp\."userId" = target\."id"/)
    assert.match(sql, /LEFT JOIN "Game" g ON g\."id" = gp\."gameId"/)
    assert.match(
      sql,
      /CAST\(COUNT\(gp\."id"\) AS INTEGER\) AS "gamesPlayed"/,
    )
  })
})

describe('refreshUserRanks', () => {
  it('clears stale rank values for users whose recomputed gamesPlayed is zero', async () => {
    const calls = []
    const tx = {
      $executeRaw: async (...args) => {
        calls.push(args)
      },
    }

    await refreshUserRanks(tx)

    assert.equal(calls.length, 2)

    const rankSql = renderTaggedSql(calls[0])
    const clearSql = renderTaggedSql(calls[1])

    assert.match(rankSql, /WHERE u\."gamesPlayed" > 0/)
    assert.match(clearSql, /UPDATE "User"/)
    assert.match(clearSql, /SET "rank" = NULL/)
    assert.match(clearSql, /WHERE "gamesPlayed" = 0 AND "rank" IS NOT NULL/)
  })
})
