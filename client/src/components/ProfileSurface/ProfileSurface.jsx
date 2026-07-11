import { useState } from 'react'
import ProfileFriends from './_components/ProfileFriends'
import ProfileGames from './_components/ProfileGames'
import ProfileHeader from './_components/ProfileHeader'
import ProfileOverview from './_components/ProfileOverview'
import ProfileSidebar from './_components/ProfileSidebar'

const ProfileSurface = ({
  friends = [],
  isOwnProfile,
  leaderboard = [],
  profile,
  relationship,
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const visibleFriends = isOwnProfile ? friends : profile.friends || []

  return (
    <div className="w-full bg-white">
      <ProfileHeader
        activeTab={activeTab}
        isOwnProfile={isOwnProfile}
        profile={profile}
        relationship={relationship}
        onTabChange={setActiveTab}
      />

      <div className="mt-[28px] flex flex-col gap-7 lg:flex-row lg:gap-[66px]">
        <main className="min-w-0 flex-1 bg-[#ffd099] p-4 sm:p-8">
          {activeTab === 'overview' && (
            <ProfileOverview
              // The server's accepted-friendship total (#396), not the capped
              // preview list, so achievements agree with the header strip.
              friendsCount={profile.stats?.friendsCount || 0}
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
    </div>
  )
}

export default ProfileSurface
