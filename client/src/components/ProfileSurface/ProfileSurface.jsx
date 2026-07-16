import { useState } from 'react'
import useHorizontalSwipe from '@/hooks/useHorizontalSwipe'
import ProfileFriends from './_components/ProfileFriends'
import ProfileGames from './_components/ProfileGames'
import ProfileHeader from './_components/ProfileHeader'
import ProfileOverview from './_components/ProfileOverview'
import ProfileSidebar from './_components/ProfileSidebar'

// Tab order for touch navigation: swiping left advances, swiping right goes
// back, mirroring the visual order of ProfileTabs.
const TAB_ORDER = ['overview', 'games', 'friends']

const ProfileSurface = ({
  friends = [],
  isOwnProfile,
  leaderboard = [],
  profile,
  relationship,
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const visibleFriends = isOwnProfile ? friends : profile.friends || []

  const handleSwipe = (direction) => {
    const activeIndex = TAB_ORDER.indexOf(activeTab)
    const nextIndex = direction === 'left' ? activeIndex + 1 : activeIndex - 1
    if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return
    setActiveTab(TAB_ORDER[nextIndex])
  }

  const swipeHandlers = useHorizontalSwipe(handleSwipe)

  return (
    <div className="w-full bg-white" {...swipeHandlers}>
      <ProfileHeader
        activeTab={activeTab}
        isOwnProfile={isOwnProfile}
        profile={profile}
        relationship={relationship}
        onTabChange={setActiveTab}
      />

      <div className="mt-5 flex flex-col gap-6 lg:mt-[28px] lg:flex-row lg:gap-[66px]">
        <main className="min-w-0 flex-1 bg-[#ffd099] p-4 sm:p-6 lg:p-8">
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
