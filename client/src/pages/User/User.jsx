import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Panel from '@/components/Panel'
import ProfileSurface from '@/components/ProfileSurface'
import LoadingSpinner from '@/components/LoadingSpinner'
import useAuthStore from '@/stores/useAuthStore'
import useProfileStore from '@/stores/useProfileStore'

const User = () => {
  const { username } = useParams()
  const authUsername = useAuthStore((state) => state.user?.username)
  const actionError = useProfileStore((state) => state.actionError)
  const error = useProfileStore((state) => state.error)
  const isLoading = useProfileStore((state) => state.isLoading)
  const isSubmitting = useProfileStore((state) => state.isSubmitting)
  const profile = useProfileStore((state) => state.publicProfile)
  const relationship = useProfileStore((state) => state.relationship)

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
    <ProfileSurface
      actionError={actionError}
      friends={[]}
      isOwnProfile={false}
      isSubmitting={isSubmitting}
      profile={profile}
      relationship={relationship}
      onFriendRequest={useProfileStore.getState().sendFriendRequest}
      onProfileUpdate={useProfileStore.getState().updateCurrentProfile}
    />
  )
}

export default User
