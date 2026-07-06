import { Link } from 'react-router-dom'
import Button from '@/components/Button'
import ProfileAvatar from '../ProfileAvatar'
import ProfileStatStrip from '../ProfileStatStrip'
import ProfileTabs from '../ProfileTabs'
import profileActions from '../../_utils/profileActions'
import profileFormatters from '../../_utils/profileFormatters'

const ProfileHeader = ({
  activeTab,
  isOwnProfile,
  isSubmitting,
  onPrimaryAction,
  onTabChange,
  profile,
  relationship,
}) => {
  const stats = profile.stats || {}
  const action = profileActions.getProfileActionState({ relationship })
  const metadata = isOwnProfile ? profile.email : `@${profile.username}`

  return (
    <header>
      <div className="relative min-h-[260px] bg-[#ffd099] px-4 pt-6 pb-18 text-[#3d1200] sm:px-6 lg:px-8">
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

          {isOwnProfile ? (
            <Link
              aria-label="Open settings"
              to="/settings"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7a3810] transition hover:bg-[#ffbf80] focus:ring-2 focus:ring-[#3d1200]/25 focus:outline-none"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          ) : (
            <Button
              className="h-9 w-full rounded-none sm:w-[138px]"
              disabled={action.isDisabled || isSubmitting}
              fullWidth={false}
              type="button"
              variant={action.variant}
              onClick={onPrimaryAction}
            >
              {isSubmitting ? 'Working' : action.label}
            </Button>
          )}
        </div>

        <div className="absolute bottom-0 left-0">
          <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
    </header>
  )
}

export default ProfileHeader
