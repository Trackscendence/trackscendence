// Block state, as seen by one viewer, derived from the shared Friendship row.
// A block reuses the friendship's BLOCKED status plus blockedById, so there is
// no separate table: whoever set blockedById is the blocker. Kept in its own
// module (no other requires) so both friends.service and messages.service can
// read it without creating a circular dependency, and so the mapping is
// unit-testable on its own.
const FRIENDSHIP_BLOCKED_STATUS = 'BLOCKED'

const BLOCK_STATE = {
  NONE: 'none',
  BLOCKED_BY_ME: 'blockedByMe',
  BLOCKED_BY_THEM: 'blockedByThem',
}

const getBlockState = (relationship, viewerId) => {
  if (!relationship || relationship.status !== FRIENDSHIP_BLOCKED_STATUS) {
    return BLOCK_STATE.NONE
  }

  return relationship.blockedById === viewerId
    ? BLOCK_STATE.BLOCKED_BY_ME
    : BLOCK_STATE.BLOCKED_BY_THEM
}

module.exports = {
  BLOCK_STATE,
  getBlockState,
}
