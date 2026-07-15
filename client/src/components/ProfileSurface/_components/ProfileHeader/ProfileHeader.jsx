import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import ProfileAvatar from '../ProfileAvatar'
import ProfileStatStrip from '../ProfileStatStrip'
import ProfileTabs from '../ProfileTabs'
import RelationshipActions from '../RelationshipActions'
import profileFormatters from '../../_utils/profileFormatters'

const ProfileHeader = ({
  activeTab,
  isOwnProfile,
  onTabChange,
  profile,
  relationship,
}) => {
  const stats = profile.stats || {}
  const metadata = isOwnProfile ? profile.email : `@${profile.username}`

  return (
    <header>
      <div className="relative bg-[#ffd099] px-4 pt-5 pb-6 text-[#3d1200] sm:px-6 sm:pt-6 sm:pb-18 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:gap-10">
            <ProfileAvatar profile={profile} />
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="text-2xl font-semibold break-words text-[#3d1200] sm:text-[28px]">
                  {profileFormatters.getDisplayName(profile)}
                </h1>
              </div>
              <p className="mt-1 text-sm break-all text-[#7a3810]">
                {metadata}
              </p>
              <ProfileStatStrip stats={stats} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {isOwnProfile ? (
              <Link
                aria-label="Open settings"
                to="/settings"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none"
              >
                <Settings aria-hidden="true" className="h-5 w-5" />
              </Link>
            ) : (
              <RelationshipActions
                profile={profile}
                relationship={relationship}
              />
            )}
          </div>
        </div>

        <div className="mt-6 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0">
          <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
    </header>
  )
}

export default ProfileHeader
