const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { BLOCK_STATE, getBlockState } = require('./friendBlockState')

describe('getBlockState', () => {
  it('is none when there is no relationship', () => {
    assert.equal(getBlockState(null, 1), BLOCK_STATE.NONE)
  })

  it('is none for an accepted friendship', () => {
    assert.equal(getBlockState({ status: 'ACCEPTED' }, 1), BLOCK_STATE.NONE)
  })

  it('is blockedByMe when the viewer set the block', () => {
    assert.equal(
      getBlockState({ status: 'BLOCKED', blockedById: 1 }, 1),
      BLOCK_STATE.BLOCKED_BY_ME,
    )
  })

  it('is blockedByThem when the other user set the block', () => {
    assert.equal(
      getBlockState({ status: 'BLOCKED', blockedById: 2 }, 1),
      BLOCK_STATE.BLOCKED_BY_THEM,
    )
  })
})
