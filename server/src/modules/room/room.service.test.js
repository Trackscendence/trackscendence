const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const roomService = require('#modules/room/room.service')

// The capacity guard runs before any database access, so it can be exercised
// without a live database (#156).
describe('seatUser capacity validation', () => {
  const user = { id: 1, username: 'tester' }

  it('rejects a capacity that is not an offered room size', async () => {
    await assert.rejects(
      () => roomService.seatUser(user, { capacity: 5 }),
      /Unsupported room size/,
    )
  })

  it('rejects an out-of-range capacity', async () => {
    await assert.rejects(() => roomService.seatUser(user, { capacity: 99 }))
    await assert.rejects(() => roomService.seatUser(user, { capacity: 0 }))
  })

  it('rejects a non-numeric capacity', async () => {
    await assert.rejects(() => roomService.seatUser(user, { capacity: NaN }))
  })
})
