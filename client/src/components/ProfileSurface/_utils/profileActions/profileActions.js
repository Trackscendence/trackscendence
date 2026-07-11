// Maps the Friendship lifecycle (docs/erm/friendship.md) to the profile's
// primary action (#395). The state machine a visitor walks: Add a friend ->
// Request sent (theirs: Request received, answered from the notification
// panel) -> accepted -> the friends pair, a handshake badge plus a mailbox
// button that opens the conversation through useDirectMessageStore. The
// owner's header shows a settings gear instead, so there is no own-profile
// state here.
const getProfileActionState = ({ relationship }) => {
  if (relationship?.status === 'FRIENDS') {
    return { isDisabled: false, kind: 'friends', label: 'Friends' }
  }

  if (relationship?.status === 'PENDING_OUTGOING') {
    // Enabled on purpose: the control reads "Request sent" and cancels the
    // request on click (hover reveals "Cancel request").
    return {
      isDisabled: false,
      kind: 'cancel',
      label: 'Request sent',
      variant: 'orangeOutline',
    }
  }

  if (relationship?.status === 'PENDING_INCOMING') {
    // The viewer answers the request right here: Accept and Reject buttons.
    return { isDisabled: false, kind: 'respond', label: 'Request received' }
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
