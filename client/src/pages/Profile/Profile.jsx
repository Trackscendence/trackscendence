import { useEffect } from 'react'
import Panel from '@/components/Panel'
import ProfileSurface from '@/components/ProfileSurface'
import LoadingSpinner from '@/components/LoadingSpinner'
import useProfileStore from '@/stores/useProfileStore'

const Profile = () => {
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const error = useProfileStore((state) => state.error)
  const friends = useProfileStore((state) => state.friends)
  const isLoading = useProfileStore((state) => state.isLoading)
  const leaderboard = useProfileStore((state) => state.leaderboard)
  const relationship = useProfileStore((state) => state.relationship)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await useProfileStore.getState().loadCurrentProfile()
      } catch {
        // Store actions own profile error state.
      }
    }

    loadProfile()
  }, [])

  if (isLoading) return <LoadingSpinner message="Loading profile" />

  if (error) {
    return (
      <Panel>
        <p className="text-sm font-semibold text-[#8a321f]">{error}</p>
      </Panel>
    )
  }

  if (!currentProfile) {
    return (
      <Panel>
        <p className="text-sm font-semibold text-[#27352f]">
          Profile unavailable
        </p>
      </Panel>
    )
  }

  return (
    <div className="space-y-6">
      <ProfileSurface
        friends={friends}
        isOwnProfile
        leaderboard={leaderboard}
        profile={currentProfile}
        relationship={relationship}
      />
    </div>
  )
}

export default Profile
