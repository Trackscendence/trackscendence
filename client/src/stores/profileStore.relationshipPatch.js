import { withFriendsCountDelta } from './profileStore.friendsCount.js'

// The profile page shows the server's accepted-friend total in two places:
// the stat strip and the achievements panel. Friendship actions only need a
// tiny local patch until the next full profile load restores server truth.

export const applyFriendRequestResponsePatch = ({
  action,
  relationship,
  state,
}) => ({
  relationship,
  ...(action === 'accept'
    ? {
        publicProfile: withFriendsCountDelta(state.publicProfile, 1),
        currentProfile: withFriendsCountDelta(state.currentProfile, 1),
      }
    : {}),
})

export const applyRelationshipRemovalPatch = ({
  relationship = null,
  state,
  wasFriends,
}) => ({
  relationship,
  ...(wasFriends
    ? {
        publicProfile: withFriendsCountDelta(state.publicProfile, -1),
        currentProfile: withFriendsCountDelta(state.currentProfile, -1),
      }
    : {}),
})
