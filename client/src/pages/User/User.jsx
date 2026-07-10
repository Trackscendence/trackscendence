import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import Panel from '@/components/Panel'
import ProfileSurface from '@/components/ProfileSurface'
import LoadingSpinner from '@/components/LoadingSpinner'
import useAuthStore from '@/stores/useAuthStore'
import useDirectMessageStore from '@/stores/useDirectMessageStore'
import useProfileStore from '@/stores/useProfileStore'

const User = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const authUsername = useAuthStore((state) => state.user?.username)
  const error = useProfileStore((state) => state.error)
  const isLoading = useProfileStore((state) => state.isLoading)
  const isSubmitting = useProfileStore((state) => state.isSubmitting)
  const leaderboard = useProfileStore((state) => state.leaderboard)
  const profile = useProfileStore((state) => state.publicProfile)
  const relationship = useProfileStore((state) => state.relationship)

  const handleMessage = async () => {
    if (!profile) return

    if (relationship?.status === 'FRIENDS') {
      const conversation = await useDirectMessageStore
        .getState()
        .ensureConversation(profile.id)
      if (conversation) {
        navigate(`/messages?conversation=${conversation.id}`)
      }
      return
    }

    setIsRequestModalOpen(true)
  }

  const submitFriendRequestMessage = async (event) => {
    event.preventDefault()
    const wasSent = await useProfileStore
      .getState()
      .sendFriendRequest(requestMessage)
    if (!wasSent) return
    setRequestMessage('')
    setIsRequestModalOpen(false)
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await useProfileStore.getState().loadPublicProfile(username)
      } catch {
        // Store actions own profile error state.
      }
    }

    if (username && username !== authUsername) {
      loadProfile()
    }
  }, [authUsername, username])

  if (authUsername === username) return <Navigate replace to="/profile" />

  if (isLoading) return <LoadingSpinner message="Loading player profile" />

  if (error) {
    return (
      <Panel>
        <p className="text-sm font-semibold text-[#8a321f]">{error}</p>
      </Panel>
    )
  }

  if (!profile) {
    return (
      <Panel>
        <p className="text-sm font-semibold text-[#27352f]">
          Player profile unavailable
        </p>
      </Panel>
    )
  }

  return (
    <>
      <ProfileSurface
        friends={[]}
        isOwnProfile={false}
        isSubmitting={isSubmitting}
        leaderboard={leaderboard}
        profile={profile}
        relationship={relationship}
        onFriendRequest={() => setIsRequestModalOpen(true)}
        onMessage={handleMessage}
      />
      <Modal
        isOpen={isRequestModalOpen}
        title="Send friend request"
        onClose={() => setIsRequestModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitFriendRequestMessage}>
          <p className="text-sm leading-6 text-[#6f5439]">
            Send a friend request with a first message.
          </p>
          <label className="block text-sm font-semibold text-[#3d1200]">
            Message
            <textarea
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-[#e6c9a8] px-3 py-2 text-sm transition outline-none focus:border-[#e86d2f]"
              maxLength={500}
              required
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
            />
          </label>
          <Button
            className="flex items-center justify-center gap-2"
            disabled={isSubmitting || !requestMessage.trim()}
            type="submit"
            variant="orange"
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            {isSubmitting ? 'Sending' : 'Send request'}
          </Button>
        </form>
      </Modal>
    </>
  )
}

export default User
