// Maps the Friendship lifecycle (docs/erm/friendship.md) to the profile's
// primary action (#395). The state machine a visitor walks: Add a friend ->
// Request sent (theirs: Request received, answered from the notification
// panel) -> accepted -> the friends pair, a handshake badge plus a mailbox
// button that opens the conversation through useDirectMessageStore. The
// owner's header shows a settings gear instead, so there is no own-profile
// state here.
const getProfileActionState = ({ relationship }) => {
  if (relationship?.status === 'FRIENDS') {
    return {
      isDisabled: false,
      kind: 'friends',
      label: 'Friends',
      variant: 'orange',
    }
  }

  if (relationship?.status === 'PENDING_OUTGOING') {
    return { isDisabled: true, label: 'Request sent', variant: 'orangeOutline' }
  }

  if (relationship?.status === 'PENDING_INCOMING') {
    return {
      isDisabled: true,
      label: 'Request received',
      variant: 'orangeOutline',
    }
  }

  if (relationship?.status === 'BLOCKED') {
    return { isDisabled: true, label: 'Unavailable', variant: 'orangeOutline' }
  }

  return {
    isDisabled: false,
    kind: 'request',
    label: 'Add a friend',
    variant: 'orange',
  }
}

export default {
  getProfileActionState,
}
