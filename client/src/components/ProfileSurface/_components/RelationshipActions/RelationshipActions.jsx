import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, UserPlus } from 'lucide-react'
import Button from '@/components/Button'
import useDirectMessageStore from '@/stores/useDirectMessageStore'
import useProfileStore from '@/stores/useProfileStore'
import profileActions from '../../_utils/profileActions'
import profileFormatters from '../../_utils/profileFormatters'
import FriendsPair from './_components/FriendsPair'
import FriendRequestModal from './_components/FriendRequestModal'

// Feature container for the profile's relationship control (#395). One slot in
// the header walks the whole Friendship lifecycle (docs/erm/friendship.md):
// Add a friend -> Request sent (click cancels) -> Accept / Reject for the
// addressee -> the friends pair, whose mailbox opens the conversation through
// the direct-message store. It owns the request modal and dispatches store
// actions itself, so nothing drills through the header.
const RelationshipActions = ({ profile, relationship }) => {
  const navigate = useNavigate()
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const isSubmitting = useProfileStore((state) => state.isSubmitting)
  const action = profileActions.getProfileActionState({ relationship })
  const displayName = profileFormatters.getDisplayName(profile)

  const handleMessage = async () => {
    const conversation = await useDirectMessageStore
      .getState()
      .ensureConversation(profile.id)
    if (conversation) navigate(`/messages?conversation=${conversation.id}`)
  }

  if (action.kind === 'friends') {
    return (
      <FriendsPair
        displayName={displayName}
        isSubmitting={isSubmitting}
        onMessage={handleMessage}
        onUnfriend={() => useProfileStore.getState().removeRelationship()}
      />
    )
  }

  if (action.kind === 'respond') {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Button
          className="flex h-10 items-center justify-center gap-2 rounded-none whitespace-nowrap"
          disabled={isSubmitting}
          fullWidth={false}
          type="button"
          variant="orange"
          onClick={() =>
            useProfileStore.getState().respondToFriendRequest('accept')
          }
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {isSubmitting ? 'Working' : 'Accept'}
        </Button>
        <Button
          className="h-10 rounded-none whitespace-nowrap"
          disabled={isSubmitting}
          fullWidth={false}
          type="button"
          variant="orangeOutline"
          onClick={() =>
            useProfileStore.getState().respondToFriendRequest('reject')
          }
        >
          Reject
        </Button>
      </div>
    )
  }

  if (action.kind === 'cancel') {
    return (
      <button
        className="group h-10 shrink-0 border border-[#e86d2f] bg-white px-5 text-sm font-semibold whitespace-nowrap text-[#e86d2f] transition hover:border-[#b6523b] hover:bg-[#fdf1ee] hover:text-[#b6523b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d1200]/25 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="button"
        onClick={() => useProfileStore.getState().removeRelationship()}
      >
        <span className="group-hover:hidden">Request sent</span>
        <span className="hidden group-hover:inline">Cancel request</span>
      </button>
    )
  }

  return (
    <>
      <Button
        className="flex h-10 items-center justify-center gap-2 rounded-none px-5 whitespace-nowrap"
        disabled={action.isDisabled || isSubmitting}
        fullWidth={false}
        type="button"
        variant={action.variant}
        onClick={() => setIsRequestModalOpen(true)}
      >
        {action.kind === 'request' && !isSubmitting ? (
          <UserPlus aria-hidden="true" className="h-4 w-4" />
        ) : null}
        {isSubmitting ? 'Working' : action.label}
      </Button>
      <FriendRequestModal
        displayName={displayName}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </>
  )
}

export default RelationshipActions
