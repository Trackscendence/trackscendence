import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import AdminBadge from '@/components/AdminBadge'
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
      {/* Phones get a compact card: small avatar beside the name, the gear
          pinned to the panel's top corner, and the tabs as a full-width
          segmented row flush with the bottom edge. From lg up this is the
          original desktop composition with the tabs absolutely anchored. */}
      <div className="relative bg-[#ffd099] px-4 pt-5 pb-0 text-[#3d1200] sm:px-6 sm:pt-6 lg:min-h-[260px] lg:px-8 lg:pb-18">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6 lg:gap-10">
            <div className="shrink-0 lg:hidden">
              <ProfileAvatar profile={profile} size={76} />
            </div>
            <div className="hidden shrink-0 lg:block">
              <ProfileAvatar profile={profile} />
            </div>
            <div className="min-w-0 flex-1">
              {/* flex-wrap: the badge wraps below a long name instead of
                  truncating it (#498). Public profiles only carry `role` for
                  admins, so everyone sees who moderates. */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-xl font-semibold break-words text-[#3d1200] sm:text-2xl lg:text-[28px]">
                  {profileFormatters.getDisplayName(profile)}
                </h1>
                <AdminBadge role={profile.role} />
              </div>
              <p className="mt-1 text-sm break-all text-[#7a3810]">
                {metadata}
              </p>
              <ProfileStatStrip stats={stats} />
            </div>
          </div>

          {isOwnProfile ? (
            <Link
              aria-label="Open settings"
              to="/settings"
              className="absolute top-4 right-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none lg:static"
            >
              <Settings aria-hidden="true" className="h-5 w-5" />
            </Link>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <RelationshipActions
                profile={profile}
                relationship={relationship}
              />
            </div>
          )}
        </div>

        <div className="mt-6 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0">
          <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
    </header>
  )
}

export default ProfileHeader
