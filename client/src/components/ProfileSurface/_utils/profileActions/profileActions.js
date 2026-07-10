// Maps the relationship to the profile's primary action (#395). The state
// machine a visitor walks: Add friend -> Requested (theirs: Request received)
// -> accepted -> Message. Friends get the message action; everyone else gets
// the friend-request path or a disabled waiting state. The owner's header
// shows a settings gear instead, so there is no own-profile state here.
const getProfileActionState = ({ relationship }) => {
  if (relationship?.status === 'FRIENDS') {
    return {
      isDisabled: false,
      kind: 'message',
      label: 'Message',
      variant: 'orange',
    }
  }

  if (relationship?.status === 'PENDING_OUTGOING') {
    return { isDisabled: true, label: 'Requested', variant: 'orangeOutline' }
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
    label: 'Add friend',
    variant: 'orange',
  }
}

export default {
  getProfileActionState,
}
