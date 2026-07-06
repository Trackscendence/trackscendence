// Only the friend-request button uses this now; the owner's header shows a
// settings gear instead, so there is no own-profile action state here.
const getProfileActionState = ({ relationship }) => {
  if (relationship?.status === 'FRIENDS') {
    return { isDisabled: true, label: 'Friends', variant: 'orangeOutline' }
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

  return { isDisabled: false, label: 'Add friend', variant: 'orange' }
}

export default {
  getProfileActionState,
}
