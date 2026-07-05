import { useState } from 'react'
import ProfileEditDialog from './_components/ProfileEditDialog'
import ProfileFriends from './_components/ProfileFriends'
import ProfileGames from './_components/ProfileGames'
import ProfileHeader from './_components/ProfileHeader'
import ProfileOverview from './_components/ProfileOverview'
import ProfileSidebar from './_components/ProfileSidebar'

const ProfileSurface = ({
  actionError,
  friends = [],
  isOwnProfile,
  isSubmitting,
  leaderboard = [],
  onFriendRequest,
  onProfileUpdate,
  profile,
  relationship,
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const visibleFriends = isOwnProfile ? friends : profile.friends || []

  const handlePrimaryAction = () => {
    if (isOwnProfile) {
      setIsEditOpen(true)
      return
    }

    void onFriendRequest()
  }

  const handleProfileUpdate = async (payload) => {
    const result = await onProfileUpdate(payload)

    if (result) {
      setIsEditOpen(false)
    }
  }

  return (
    <div className="w-full bg-white">
      <ProfileHeader
        activeTab={activeTab}
        isOwnProfile={isOwnProfile}
        isSubmitting={isSubmitting}
        profile={profile}
        relationship={relationship}
        onPrimaryAction={handlePrimaryAction}
        onTabChange={setActiveTab}
      />

      <div className="mt-[28px] flex flex-col gap-7 lg:flex-row lg:gap-[66px]">
        <main className="min-w-0 flex-1 bg-[#ffd099] p-4 sm:p-8">
          {activeTab === 'overview' && (
            <ProfileOverview
              friendsCount={visibleFriends.length}
              profile={profile}
              onShowGames={() => setActiveTab('games')}
            />
          )}
          {activeTab === 'games' && (
            <ProfileGames matches={profile.recentMatches || []} />
          )}
          {activeTab === 'friends' && (
            <ProfileFriends friends={friends} isOwnProfile={isOwnProfile} />
          )}
        </main>

        {activeTab === 'overview' && (
          <ProfileSidebar
            friends={visibleFriends}
            leaderboard={leaderboard}
            profile={profile}
            onShowFriends={() => setActiveTab('friends')}
          />
        )}
      </div>

      {isOwnProfile && (
        <ProfileEditDialog
          error={actionError}
          isOpen={isEditOpen}
          isSubmitting={isSubmitting}
          profile={profile}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleProfileUpdate}
        />
      )}
    </div>
  )
}

export default ProfileSurface
